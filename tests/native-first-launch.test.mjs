import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixture = `<!doctype html><div id="root"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {HomeAssistantHostSessionProvider} from '@cabane/engine';
import {WorkspaceApplication} from '/src/workspaces/WorkspaceApplication';
import {initializeWorkspaces} from '/src/workspaces/initialize-workspaces';
import {exportWorkspaceBackup} from '/src/workspaces/workspace-transfer';
const mode = new URLSearchParams(location.search).get('mode');
const {repository} = await initializeWorkspaces(indexedDB, localStorage, {skipLegacyMigration:true});
window.repository=repository;
const requests=[]; window.requests=requests; window.failList=mode==='error';
let saved;
if (mode==='saved' || mode==='error' || mode==='local') {
 const entry=await repository.createBlank('Saved HA home');
 saved={home_id:entry.metadata.id, name:'Saved HA home', version:1, document:exportWorkspaceBackup({...entry.metadata,homeAssistantUrl:location.origin},entry.record)};
 if(mode!=='local') await repository.delete(entry.metadata.id,await repository.readRaw(entry.metadata.id));
 else localStorage.setItem('cabane:last-opened-workspace',entry.metadata.id);
}
if(mode==='dismissed') await repository.dismissOnboarding('welcome');
const connection={connected:mode!=='disconnected',haVersion:'2026.10.0',addEventListener(){},removeEventListener(){},
 get auth(){throw Error('must not read auth')},close(){throw Error('must not close host')},
 async sendMessagePromise(message){requests.push(message.type);
  if(message.type==='cabane/workspaces/list') {if(mode==='timeout')return new Promise(()=>{});if(window.failList)throw Error('Storage unavailable');return saved?[saved]:[];}
  if(message.type==='cabane/workspaces/get')return saved;
  if(message.type.startsWith('config/'))return [];
  throw Error('Unexpected request '+message.type);
 },async subscribeEvents(){return ()=>{}},async subscribeMessage(callback){queueMicrotask(()=>callback({a:{}}));return ()=>{}}
};
Object.defineProperty(connection,"auth",{enumerable:false});
window.open=()=>{throw Error('must not start OAuth')};
window.router=createMemoryRouter([{path:'*',element:React.createElement(WorkspaceApplication)}],{initialEntries:['/']});
const app=React.createElement(RouterProvider,{router:window.router});
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,mode==='standalone'?app:React.createElement(HomeAssistantHostSessionProvider,{session:{connection,origin:location.origin}},app)));
</script>`;

test("native first launch imports a saved home through the real host and preserves it on reload", async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), "cabane-first-launch-vite-"));
  const server = await createServer({
    cacheDir,
    root: `${process.cwd()}/apps/web`,
    configFile: `${process.cwd()}/apps/web/vite.config.ts`,
    server: { host: "127.0.0.1", port: 0, hmr: false, watch: null },
    plugins: [
      {
        name: "first-launch-fixture",
        configureServer(server) {
          server.middlewares.use("/native-first-launch", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(await server.transformIndexHtml("/native-first-launch", fixture));
          });
        },
      },
    ],
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const open = async (mode) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      if (mode === "timeout") await page.clock.install();
      await page.goto(server.resolvedUrls.local[0] + "native-first-launch?mode=" + mode);
      return page;
    };
    const saved = await open("saved");
    await saved
      .getByRole("heading", { name: "Import a workspace", exact: true })
      .waitFor({ timeout: 15000 });
    await saved.getByText("Saved HA home", { exact: true }).waitFor();
    assert.equal(
      await saved.getByRole("button", { name: "Create a new home", exact: true }).count(),
      1,
    );
    assert.equal(
      await saved.getByRole("button", { name: "Explore the demo", exact: true }).count(),
      1,
    );
    await saved.getByRole("button", { name: "Open", exact: true }).click();
    await saved.getByRole("button", { name: /Workspaces: Saved HA home/ }).waitFor();
    assert.equal(await saved.getByRole("dialog").count(), 0);
    assert.equal(
      (await saved.evaluate(() => window.requests)).some(
        (type) => type === "call_service" || type === "cabane/workspaces/put",
      ),
      false,
    );
    await saved.reload();
    await saved.waitForFunction(() =>
      window.router?.state.location.pathname.startsWith("/workspaces/"),
    );
    assert.equal(
      await saved.getByRole("heading", { name: "Import a workspace", exact: true }).count(),
      0,
    );
    await saved.context().close();
  } finally {
    await browser?.close();
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

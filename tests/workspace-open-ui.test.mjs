import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

test('fresh receiving session opens the exact HA home with sync; divergent or wrong-server data stays untouched', async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req,res,next) => req.url === '/' ? (res.setHeader('Content-Type','text/html'),res.end('<!doctype html>')) : next());
    await server.listen(); browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const options of [{}, { divergent:true }, { wrongOrigin:true }, { missing:true }]) {
      const context = await browser.newContext(); const page = await context.newPage();
      await page.goto(server.resolvedUrls.local[0]);
      await page.evaluate(async options => { const h = await import('/tests/fixtures/ha-storage-harness.tsx'); window.openHarness = await h.mountHaOpenHarness(options); }, options);
      if (!Object.keys(options).length) {
        await page.waitForFunction(() => window.openHarness.getOpened());
        const result = await page.evaluate(async () => {
          const {readSyncCursor} = await import('/apps/web/src/workspaces/workspace-sync-state.ts');
          const h=window.openHarness;return { id:h.id,opened:h.getOpened(),entry:await h.repository.read(h.id),cursor:await readSyncCursor(indexedDB,'https://ha.test',h.id),calls:h.getCalls() };
        });
        assert.equal(result.id,result.opened);assert.equal(result.entry.metadata.name,'Remote cottage');assert.equal(result.cursor.enabled,true);assert.deepEqual(result.calls,['cabane/workspaces/get']);
      } else {
        await page.getByRole('alert').waitFor();
        assert.equal(await page.evaluate(() => window.openHarness.getOpened()),null);
        const entry = await page.evaluate(async () => window.openHarness.repository.read(window.openHarness.id));
        if (options.divergent) { assert.equal(entry.metadata.name,'My local changes'); await page.getByRole('link',{name:'Review copies'}).waitFor(); }
        else assert.equal(entry,null);
      }
      await context.close();
    }
  } finally { await browser?.close(); await server.close(); }
});

test('the real receiving route needs no local workspace and malformed links offer recovery', async () => {
  const server=await createServer({root:`${process.cwd()}/apps/web`,configFile:`${process.cwd()}/apps/web/vite.config.ts`,server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
  let browser;
  try {
    await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const base=server.resolvedUrls.local[0];
    await page.goto(`${base}open/home-123?ha=https%3A%2F%2Fha.example&view=dashboard`);
    await page.getByRole('button',{name:'Sign in & open'}).waitFor();
    await page.reload();await page.getByRole('button',{name:'Sign in & open'}).waitFor();
    await page.goto(`${base}open/home-123?ha=javascript:bad`);await page.getByRole('heading',{name:'This link is incomplete'}).waitFor();
    await page.getByRole('link',{name:'Open from Home Assistant'}).click();await page.getByRole('dialog').waitFor();
    await page.getByLabel('Home Assistant address').waitFor();
  } finally {await browser?.close();await server.close();}
});

import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

// A disposable browser profile exercises the real host and IndexedDB together.
test("workspace host routes zero, one, multiple, missing and OAuth target homes", async () => {
  const server = await createServer({ root: `${process.cwd()}/apps/web`, configFile: `${process.cwd()}/apps/web/vite.config.ts`, server: { host: "127.0.0.1", port: 0, strictPort: false, hmr: false, watch: null } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const base = server.resolvedUrls.local[0];
    await page.goto(base);
    await page.getByRole("heading", { name: "Your home. In 3D. Under your control.", exact: true }).waitFor();
    const demoUrl = page.url();
    assert.equal(await page.getByRole("button", { name: /^Connect my Home Assistant/ }).count(), 0);
    await page.getByRole("button", { name: /^Explore the demo/ }).click();
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.waitForURL("**/construct");
    const personalUrl = page.url();
    assert.notEqual(personalUrl.split("/")[4], demoUrl.split("/")[4]);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("heading", { name: "Connect your home", exact: true }).waitFor();
    await page.goto(`${demoUrl}/connect/devices`);
    await page.waitForURL(`${demoUrl}/connect/devices`);
    assert.equal(page.url(), `${demoUrl}/connect/devices`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.goto(demoUrl);
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.waitForURL(personalUrl);
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      for (const entry of await repository.list()) await repository.delete(entry.metadata.id, await repository.readRaw(entry.metadata.id));
    }, process.cwd());
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    const first = await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).createBlank("First home")).metadata.id;
    }, process.cwd());
    await page.goto(base);
    await page.waitForURL(`**/workspaces/${first}/construct`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Construct", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Workspaces: First home", exact: true }).click();
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.goto(`${base}workspaces`);
    const second = await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).createBlank("Second home")).metadata.id;
    }, process.cwd());
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.goto(`${base}workspaces/missing-home`);
    await page.getByText("Could not open this workspace.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Workspaces", exact: true }).getAttribute("href"), "/workspaces");
    await page.evaluate(id => sessionStorage.setItem("cabane:editor-return:v1", JSON.stringify({ workspaceId: id, mode: "connect", view: "rooms" })), second);
    await page.goto(`${base}?auth_callback=1`);
    await page.waitForURL(`**/workspaces/${second}/connect/rooms*`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Connect", exact: true }).getAttribute("aria-pressed"), "true");
    await page.evaluate(() => sessionStorage.removeItem("cabane:editor-return:v1"));
    await page.goto(`${base}?auth_callback=1`);
    await page.getByText("This sign-in no longer has a workspace.", { exact: true }).waitFor();
    await page.evaluate(() => sessionStorage.setItem("cabane:editor-return:v1", JSON.stringify({ workspaceId: "deleted-home", mode: "connect" })));
    await page.goto(`${base}?auth_callback=1`);
    await page.getByText("This sign-in no longer has a workspace.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Workspaces", exact: true }).click();
    await page.waitForURL("**/workspaces");
    await page.evaluate(async id => {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open("cabane-projects-v2");
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("home-projects", "readwrite");
          tx.objectStore("home-projects").put("{damaged-fixture", id);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
        request.onerror = () => reject(request.error);
      });
    }, first);
    await page.goto(`${base}workspaces/${first}`);
    await page.getByText("Your saved project needs recovery.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Workspaces", exact: true }).click();
    await page.waitForURL("**/workspaces");
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();

    await page.evaluate(() => sessionStorage.removeItem("cabane:editor-return:v1"));
    await page.goto(`${base}workspaces/${second}/construct`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.evaluate(async ({ root, id }) => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      await repository.delete(id, await repository.readRaw(id));
      window.dispatchEvent(new Event("focus"));
    }, { root: process.cwd(), id: second });
    await page.getByText("This workspace was deleted in another tab.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("navigation", { name: "Editor mode" }).count(), 0);
  } finally { await browser?.close(); await server.close(); }
});

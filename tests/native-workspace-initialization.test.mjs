import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

test("native initialization never reads or migrates legacy connection storage", async () => {
  const server = await createServer({ root: `${process.cwd()}/apps/web`, configFile: `${process.cwd()}/apps/web/vite.config.ts`, server: { host: "127.0.0.1", port: 0, hmr: false, watch: null } });
  let browser;
  try {
    await server.listen(); browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(`${server.resolvedUrls.local[0]}cabane-icon.png`);
    const result = await page.evaluate(async () => {
      const { initializeWorkspaces } = await import("/src/workspaces/initialize-workspaces.ts");
      const accesses = [];
      const trap = Object.fromEntries(["getItem", "setItem", "removeItem"].map(operation => [operation, key => { accesses.push([operation, key]); throw new Error("Native mode accessed standalone storage"); }]));
      const native = await initializeWorkspaces(indexedDB, trap, { skipLegacyMigration: true });
      const entries = await native.repository.list();
      const nativeResult = { accesses: [...accesses], error: native.migrationError ?? null, count: entries.length, origins: entries.map(entry => entry.metadata.homeAssistantUrl), migrationDone: await native.repository.migrationDone() };
      const standalone = await initializeWorkspaces(indexedDB, { getItem(key) { accesses.push(["getItem", key]); return null; }, setItem() {}, removeItem() {} });
      return { ...nativeResult, standaloneReads: accesses.map(entry => entry[1]), standaloneMigrationDone: await standalone.repository.migrationDone() };
    });
    assert.deepEqual(result.accesses, []); assert.equal(result.error, null);
    assert.equal(result.count, 1); assert.deepEqual(result.origins, [null]); assert.equal(result.migrationDone, false);
    assert.ok(result.standaloneReads.includes("cabane:ha-auth:v1")); assert.equal(result.standaloneMigrationDone, true);
  } finally { await browser?.close(); await server.close(); }
});

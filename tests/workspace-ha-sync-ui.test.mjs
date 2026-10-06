import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

test("authenticated storage controls save manually then opt into sync", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    const id = await page.evaluate(async () => {
      const harness = await import("/tests/fixtures/ha-storage-harness.tsx");
      window.haHarness = await harness.mountHaStorageHarness();
      return window.haHarness.id;
    });
    await page.getByRole("button", { name: "Workspace storage" }).click();
    await page.getByRole("button", { name: "Save to HA" }).click();
    await page.getByText("Saved on HA · Sync off").waitFor();
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), 1);
    await page.getByRole("checkbox", { name: "Sync automatically" }).check();
    await page.evaluate(async homeId => {
      const entry = await window.haHarness.repository.read(homeId);
      await window.haHarness.repository.rename(homeId, entry.record.revision, "Renamed room");
    }, id);
    await page.waitForFunction(() => window.haHarness.getRemoteVersion() === 2, { timeout: 10000 });
  } finally { await browser?.close(); await server.close(); }
});

test("automatic sync continues when Connection settings are absent", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    const id = await page.evaluate(async () => {
      const harness = await import("/tests/fixtures/ha-storage-harness.tsx");
      window.haBackground = await harness.mountHaStorageBackgroundHarness();
      return window.haBackground.id;
    });
    await page.evaluate(async homeId => {
      const entry = await window.haBackground.repository.read(homeId);
      await window.haBackground.repository.rename(homeId, entry.record.revision, "Edited in Construct");
    }, id);
    await page.waitForFunction(() => window.haBackground.getRemoteVersion() === 2, { timeout: 10000 });
    assert.equal(await page.getByRole("button", { name: "Workspace storage" }).count(), 0);
  } finally { await browser?.close(); await server.close(); }
});

import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

test("authenticated storage enables sync in one action without a preliminary upload", async () => {
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
    await page.getByRole("button", { name: "Enable sync", exact: true }).click();
    await page.getByText("Synced with HA", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), 1);
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

test("storage setup explains a missing integration and never offers unavailable operations", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    await page.evaluate(async () => {
      const harness = await import("/tests/fixtures/ha-storage-harness.tsx");
      await harness.mountHaStorageHarness({ missing: true });
    });
    await page.getByRole("heading", { name: "Install Cabane", exact: true }).waitFor();
    await page.getByText("Install manually or get help", { exact: true }).click();
    assert.equal(await page.getByRole("link", { name: /Setup guide/ }).getAttribute("href"), "https://github.com/cabane-app/cabane-home-assistant#install");
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).count(), 0);
    assert.equal(await page.getByRole("switch").count(), 0);
    await page.getByRole("button", { name: "Check again" }).click();
    await page.getByRole("heading", { name: "Install Cabane", exact: true }).waitFor();
  } finally { await browser?.close(); await server.close(); }
});

test("deleting the remote copy disables sync and preserves the local workspace", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.on("dialog", dialog => dialog.accept());
    await page.goto(server.resolvedUrls.local[0]);
    await page.evaluate(async () => {
      const harness = await import("/tests/fixtures/ha-storage-harness.tsx");
      window.haHarness = await harness.mountHaStorageHarness();
    });
    assert.equal(await page.getByRole("switch").count(), 0);
    await page.getByRole("button", { name: "Enable sync", exact: true }).click();
    await page.getByText("Synced with HA", { exact: true }).waitFor();
    await page.getByText("Manage saved copy", { exact: true }).click();
    await page.getByRole("button", { name: "Delete saved copy" }).click();
    await page.getByText("Home Assistant copy deleted. Your browser copy is safe.").waitFor();
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), null);
    assert.equal(await page.getByRole("button", { name: "Enable sync", exact: true }).count(), 1);
    assert.equal(await page.evaluate(async () => Boolean((await window.haHarness.repository.read(window.haHarness.id))?.record)), true);
  } finally { await browser?.close(); await server.close(); }
});

test("the settings page imports a full backup into the draft without publishing it", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    page.on("dialog", dialog => dialog.accept());
    await page.goto(server.resolvedUrls.local[0]);
    const imported = await page.evaluate(async () => {
      const harness = await import("/tests/fixtures/ha-storage-harness.tsx");
      const { exportWorkspaceBackup } = await import("/apps/web/src/workspaces/workspace-transfer.ts");
      window.haHarness = await harness.mountHaStorageHarness({ fullPage: true });
      const entry = await window.haHarness.repository.read(window.haHarness.id);
      const originalPublished = JSON.stringify(entry.record.published);
      entry.record.draft.home.name = "Restored draft";
      return { json: exportWorkspaceBackup(entry.metadata, entry.record), originalPublished };
    });
    const backupDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export backup", exact: true }).click();
    assert.match((await backupDownload).suggestedFilename(), /-backup\.json$/);
    await page.locator('input[type="file"]').setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(imported.json) });
    await page.getByText("Backup imported into the draft. Open the editor to review and save it.").waitFor();
    const saved = await page.evaluate(async () => (await window.haHarness.repository.read(window.haHarness.id)).record);
    assert.equal(saved.draft.home.name, "Restored draft");
    assert.equal(JSON.stringify(saved.published), imported.originalPublished);
    assert.equal(saved.publishedAt, 0);
  } finally { await browser?.close(); await server.close(); }
});


test("a first manual backup remains available without enabling sync", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen(); browser = await chromium.launch({ channel: "chrome", headless: true }); const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    await page.evaluate(async () => { const h = await import("/tests/fixtures/ha-storage-harness.tsx"); window.haHarness = await h.mountHaStorageHarness(); });
    await page.getByRole("button", { name: "Enable sync", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), null);
    await page.getByText("Manage saved copy", { exact: true }).click({ timeout: 1500 });
    await page.getByRole("button", { name: "Save a copy now" }).click();
    await page.getByText("Saved to HA · sync off", { exact: true }).waitFor();
    const enabled = await page.evaluate(async () => { const {readSyncCursor} = await import("/apps/web/src/workspaces/workspace-sync-state.ts"); return (await readSyncCursor(indexedDB, "https://ha.test", window.haHarness.id)).enabled; });
    assert.equal(enabled, false);
  } finally { await browser?.close(); await server.close(); }
});


test("sidebar setup waits for saved sync, opens the actual HA panel, and keeps mobile optional", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen(); browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage(); await page.goto(server.resolvedUrls.local[0]);
    await page.evaluate(async () => { const h = await import("/tests/fixtures/ha-storage-harness.tsx"); window.haHarness = await h.mountHaStorageHarness(); });
    await page.getByRole("button", { name: "Enable sync", exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Open in Home Assistant", exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), null);
    await page.getByRole("button", { name: "Enable sync", exact: true }).click();
    const open = page.getByRole("link", { name: "Open in Home Assistant", exact: true });
    await open.waitFor({ timeout: 2500 });
    assert.equal(await open.getAttribute("href"), "https://ha.test/cabane");
    const mobile = page.locator("details").filter({ has: page.getByText("Using the mobile app?", { exact: true }) });
    assert.equal(await mobile.getAttribute("open"), null);
    await mobile.locator("summary").click();
    assert.equal(await mobile.getByText(/same Home Assistant instance/).isVisible(), true);
  } finally { await browser?.close(); await server.close(); }
});

test("storage-only integrations do not imply the sidebar is installed", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen(); browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage(); await page.goto(server.resolvedUrls.local[0]);
    await page.evaluate(async () => { const h = await import("/tests/fixtures/ha-storage-harness.tsx"); window.haHarness = await h.mountHaStorageHarness({ panelMissing: true }); });
    await page.getByRole("link", { name: "Install with HACS", exact: true }).waitFor({ timeout: 2500 });
    assert.equal(await page.getByRole("link", { name: "Open in Home Assistant", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Check again", exact: true }).click();
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), null);
    await page.evaluate(() => window.haHarness.setIntegrationInstalled());
    await page.getByRole("button", { name: "Check again", exact: true }).click();
    await page.getByRole("button", { name: "Enable sync", exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Install with HACS", exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => window.haHarness.getRemoteVersion()), null);
  } finally { await browser?.close(); await server.close(); }
});

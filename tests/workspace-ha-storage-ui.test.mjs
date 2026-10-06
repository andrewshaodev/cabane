import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

test("personal workspace offers HA storage while demo does not", async () => {
  const server = await createServer({ root: `${process.cwd()}/apps/web`, configFile: `${process.cwd()}/apps/web/vite.config.ts`,
    server: { host: "127.0.0.1", port: 0, hmr: false, watch: null } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByRole("button", { name: /^Explore the demo/ }).click();
    assert.equal(await page.getByRole("button", { name: "Workspace storage" }).count(), 0);
    const demoHomeUrl = page.url();
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: "Home Assistant", exact: true }).click();
    await page.waitForURL("**/home-assistant");
    await page.getByRole("heading", { name: "Make this home yours" }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Save across devices" }).count(), 0);
    assert.equal(await page.getByLabel("Home Assistant URL").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Enable HA storage" }).count(), 0);
    await page.goto(demoHomeUrl);
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Workspace storage" }).count(), 0);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("button", { name: "Connection settings" }).click();
    await page.waitForURL("**/home-assistant");
    await page.getByRole("heading", { name: "Home Assistant", exact: true }).waitFor();
    await page.getByLabel("Home Assistant URL").waitFor();
    await page.getByRole("heading", { name: "Save across devices" }).waitFor();
    await page.getByText("Connect Home Assistant first").waitFor();
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).count(), 0);
    await page.goto(`${server.resolvedUrls.local[0]}workspaces`);
    assert.equal(await page.getByRole("heading", { name: "Restore from Home Assistant" }).count(), 0);
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await page.getByRole("button", { name: "From Home Assistant" }).click();
    await page.getByLabel("Home Assistant address").fill("https://ha.example");
    await page.reload();
    assert.equal(await page.getByLabel("Home Assistant address").inputValue(), "https://ha.example");
  } finally { await browser?.close(); await server.close(); }
});

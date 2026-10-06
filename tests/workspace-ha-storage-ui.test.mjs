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
    await page.goto(`${demoHomeUrl}/connect/devices`);
    await page.getByRole("button", { name: "Connection settings" }).click();
    assert.equal(await page.getByRole("button", { name: "Workspace storage" }).count(), 0);
    await page.goto(demoHomeUrl);
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Workspace storage" }).count(), 0);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("button", { name: "Connection settings" }).click();
    await page.getByRole("button", { name: "Workspace storage" }).click();
    await page.getByText("Set a Home Assistant address in Connect before saving this workspace.").waitFor();
    await page.goto(`${server.resolvedUrls.local[0]}workspaces`);
    await page.getByRole("heading", { name: "Restore from Home Assistant" }).waitFor();
    await page.getByLabel("Home Assistant address").fill("https://ha.example");
    await page.reload();
    assert.equal(await page.getByLabel("Home Assistant address").inputValue(), "https://ha.example");
  } finally { await browser?.close(); await server.close(); }
});

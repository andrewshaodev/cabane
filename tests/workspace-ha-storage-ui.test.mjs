import assert from "node:assert/strict";
import test from "node:test";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

test("personal workspace offers HA storage while demo does not", async () => {
  const { server } = await getBrowserTestServer("app");
  let browser;
  try {
    browser = await createBrowserTestSession();
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByRole("button", { name: /^Explore the demo/ }).click();
    assert.equal(await page.getByRole("button", { name: "Set up Cabane" }).count(), 0);
    const demoId = await page.evaluate(async (root) => {
      const { createWorkspaceRepository } = await import(
        `/@fs${root}/packages/engine/src/home-project/index.ts`
      );
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).readOnboarding())
        .demoWorkspaceId;
    }, process.cwd());
    const demoHomeUrl = `${server.resolvedUrls.local[0]}workspaces/${demoId}`;
    await page.goto(`${demoHomeUrl}/home-assistant`);
    await page.getByRole("heading", { name: "Make this home yours" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Set up Cabane" }).count(), 0);
    assert.equal(await page.getByRole("heading", { name: "Set up Cabane" }).count(), 0);
    assert.equal(await page.getByLabel("Home Assistant URL").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Enable HA storage" }).count(), 0);
    await page.goto(demoHomeUrl);
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Set up Cabane" }).count(), 0);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("button", { name: "Connection settings" }).click();
    await page.waitForURL("**/home-assistant");
    await page.getByRole("heading", { name: "Home Assistant", exact: true }).waitFor();
    await page.getByLabel("Home Assistant URL").waitFor();
    await page.getByRole("heading", { name: "Set up Cabane" }).waitFor();
    await page.getByText("Connect Home Assistant first").waitFor();
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).count(), 0);
    await page.goto(`${server.resolvedUrls.local[0]}workspaces`);
    assert.equal(
      await page.getByRole("heading", { name: "Restore from Home Assistant" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Import workspace", exact: true }).click();
    await page.getByRole("button", { name: "From Home Assistant", exact: true }).click();

    await page.getByLabel("Home Assistant address").fill("https://ha.example");
    await page.reload();
    assert.equal(
      await page.getByLabel("Home Assistant address").inputValue(),
      "https://ha.example",
    );
  } finally {
    await browser?.close();
  }
});

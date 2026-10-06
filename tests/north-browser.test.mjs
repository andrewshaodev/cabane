import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { waitForSceneCamera } from "../scripts/browser-scene-settle.mjs";

test(
  "north orientation edits persist and solar preview renders through the normal UI",
  { timeout: 90_000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    let browser;
    try {
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${server.resolvedUrls.local[0]}build`);
      await page.getByRole("button", { name: "Current floor", exact: true }).waitFor();
      await page.waitForFunction(
        () => !document.querySelector(".construct-floor-controls__trigger")?.disabled,
      );
      await page.locator("summary").filter({ hasText: "Orient sunlight" }).click();
      const angle = page.getByLabel("North angle (degrees)", { exact: true });
      assert.equal(await angle.inputValue(), "0");
      await angle.fill("90");
      await angle.press("Enter");
      await page
        .getByRole("img", { name: "North points 90 degrees clockwise from plan up" })
        .waitFor();
      await page.locator(".direction-status").waitFor({ state: "detached" });
      await page.screenshot({ path: "/tmp/cabane-north-desktop.png" });
      await page.reload();
      await page.getByRole("button", { name: "Current floor", exact: true }).waitFor();
      await page.locator("summary").filter({ hasText: "Orient sunlight" }).click();
      assert.equal(await angle.inputValue(), "90");
      await page.setViewportSize({ width: 390, height: 844 });
      await angle.scrollIntoViewIfNeeded();
      assert.equal(await angle.isVisible(), true);
      await page.screenshot({ path: "/tmp/cabane-north-mobile.png" });
      await page.setViewportSize({ width: 1440, height: 1000 });
      const { makeStairProject } = await server.ssrLoadModule(
        `${process.cwd()}/tests/fixtures/multiple-floors.ts`,
      );
      const { createSeedProjectRecord } = await server.ssrLoadModule(
        `${process.cwd()}/packages/engine/src/home-project/repository.ts`,
      );
      const project = makeStairProject();
      project.home.northAngleDegrees = 90;
      await page.goto(`${server.resolvedUrls.local[0]}workspaces`);
      await page.getByRole("button", { name: "Import workspace", exact: true }).click();
      await page.getByLabel("Cabane JSON file").setInputFiles({
        name: "north.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(createSeedProjectRecord(project))),
      });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import workspace", exact: true })
        .click();
      await page.getByRole("button", { name: "View", exact: true }).waitFor();
      const daylight = page.getByRole("button", { name: "Use daylight", exact: true });
      if (await daylight.count()) await daylight.click();
      await page.getByRole("button", { name: "View", exact: true }).click();
      await waitForSceneCamera(page, "OrthographicCamera");
      await page.screenshot({ path: "/tmp/cabane-north-orbit.png" });
      await page.getByRole("button", { name: "Walk mode", exact: true }).click();
      await waitForSceneCamera(page, "PerspectiveCamera");
      await page.screenshot({ path: "/tmp/cabane-north-walk.png" });
      await page.getByLabel("More options", { exact: true }).focus();
      await page.getByLabel("More options", { exact: true }).press("Enter");
      await page.getByRole("button", { name: "Preferences", exact: true }).press("Enter");
      await page.getByRole("radio", { name: "Auto", exact: true }).check();
      assert.match(await page.getByRole("dialog").innerText(), /Source: Local time/);
      await page.screenshot({ path: "/tmp/cabane-north-preferences.png" });
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }),
);

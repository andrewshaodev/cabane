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
      await page.getByRole("button", { name: "Wall", exact: true }).click();
      for (const [x, y] of [
        [600, 380],
        [1000, 380],
        [1000, 700],
        [600, 700],
        [600, 380],
      ])
        await page.mouse.click(x, y);
      await page.keyboard.press("Escape");
      await page.locator("summary").filter({ hasText: "Orient the compass" }).click();
      const north = page.getByRole("region", { name: "North orientation", exact: true });
      const edit = page.getByRole("button", { name: "Set north on plan", exact: true });
      await waitForSceneCamera(page, "OrthographicCamera");
      const cameraPose = () =>
        page.evaluate(() => {
          const state = [...window.sceneCameraProbe.roots.values()]
            .map((root) => root.store.getState())
            .find((state) => state.internal.active);
          return [
            ...state.camera.position.toArray(),
            ...state.camera.quaternion.toArray(),
            state.camera.zoom,
          ];
        });
      const before = await cameraPose();
      await edit.click();
      const dial = page.getByRole("slider", { name: "Rotate compass", exact: true });
      await dial.waitFor();
      await waitForSceneCamera(page, "OrthographicCamera");
      const bounds = await dial.boundingBox();
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.06);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * 0.94, bounds.y + bounds.height / 2, {
        steps: 8,
      });
      await page.mouse.up();
      assert.equal(await dial.getAttribute("aria-valuenow"), "90");
      assert.match(await north.textContent(), /Current direction: 0°/);
      for (const label of ["N", "E", "S", "W"])
        assert.equal(
          await page
            .locator(".north-orientation text")
            .filter({ hasText: new RegExp(`^${label}$`) })
            .count(),
          1,
        );
      assert.equal(await page.locator(".north-orientation line").count(), 72);
      await page.screenshot({ path: "/tmp/cabane-north-desktop.png" });
      await page.getByRole("button", { name: "Confirm direction", exact: true }).click();
      await waitForSceneCamera(page, "OrthographicCamera");
      const after = await cameraPose();
      assert.ok(
        after.every((value, index) => Math.abs(value - before[index]) < 1e-5),
        JSON.stringify({ before, after }),
      );
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      assert.match(await north.textContent(), /Current direction: 0°/);
      await page.getByRole("button", { name: "Redo", exact: true }).click();
      assert.match(await north.textContent(), /Current direction: 90°/);
      await edit.click();
      await dial.press("ArrowRight");
      assert.equal(await dial.getAttribute("aria-valuenow"), "95");
      await dial.press("Shift+ArrowLeft");
      assert.equal(await dial.getAttribute("aria-valuenow"), "94");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      assert.match(await north.textContent(), /Current direction: 90°/);
      await edit.click();
      await dial.press("Home");
      await dial.press("Escape");
      assert.match(await north.textContent(), /Current direction: 90°/);
      await page.locator(".direction-status").waitFor({ state: "detached" });
      await page.reload();
      await page.getByRole("button", { name: "Current floor", exact: true }).waitFor();
      await page.locator("summary").filter({ hasText: "Orient the compass" }).click();
      assert.match(await north.textContent(), /Current direction: 90°/);
      await page.setViewportSize({ width: 390, height: 844 });
      await edit.scrollIntoViewIfNeeded();
      await edit.click();
      await dial.waitFor();
      await page.waitForFunction(() => {
        const model = document.querySelector(".direction-preview__model");
        const canvas = model?.querySelector("canvas");
        return (
          canvas &&
          Math.abs(canvas.getBoundingClientRect().height - model.getBoundingClientRect().height) < 2
        );
      });
      await waitForSceneCamera(page, "OrthographicCamera");
      await page.screenshot({ path: "/tmp/cabane-north-mobile.png" });
      assert.equal(await dial.isVisible(), true);
      assert.equal(
        await page.getByRole("button", { name: "Confirm direction", exact: true }).isVisible(),
        true,
      );
      const touch = await page.context().newCDPSession(page);
      const mobileDial = await dial.boundingBox();
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          {
            x: mobileDial.x + mobileDial.width * 0.94,
            y: mobileDial.y + mobileDial.height / 2,
            id: 1,
          },
        ],
      });
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: mobileDial.x + mobileDial.width / 2,
            y: mobileDial.y + mobileDial.height * 0.94,
            id: 1,
          },
        ],
      });
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      assert.equal(await dial.getAttribute("aria-valuenow"), "180");
      await touch.detach();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
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

import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { waitForSceneCamera } from "../scripts/browser-scene-settle.mjs";

test(
  "wall face colors use room labels, highlight the edited side, and survive Save and reload",
  { timeout: 90_000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    const browser = await createBrowserTestSession();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
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
      await page.getByRole("button", { name: "Wall", exact: true }).click();
      await page.mouse.click(800, 380);
      await page.mouse.click(800, 700);
      await page.keyboard.press("Escape");
      for (const name of ["Living room", "Kitchen"]) {
        await page
          .getByRole("button", { name: /^Rename Unnamed room/ })
          .first()
          .click();
        await page.getByLabel("Room name on plan").fill(name);
        await page.getByLabel("Room name on plan").press("Enter");
      }
      const selectDivider = async () => {
        const a = await page
          .getByRole("button", { name: "Rename Living room", exact: true })
          .boundingBox();
        const b = await page
          .getByRole("button", { name: "Rename Kitchen", exact: true })
          .boundingBox();
        await page.mouse.click(
          (a.x + a.width / 2 + b.x + b.width / 2) / 2,
          Math.min(a.y, b.y) - 50,
        );
      };
      await page.getByRole("button", { name: "Select", exact: true }).click();
      await selectDivider();
      await page.getByLabel("Wall color", { exact: true }).fill("#aabbcc");
      await page.getByLabel("Wall color", { exact: true }).blur();
      await page.getByLabel("Different colors on each side").check();
      const living = page.getByLabel("Living room side color", { exact: true });
      const kitchen = page.getByLabel("Kitchen side color", { exact: true });
      assert.equal(await living.inputValue(), "#aabbcc");
      assert.equal(await kitchen.inputValue(), "#aabbcc");
      await kitchen.fill("#223344");
      await kitchen.blur();
      await waitForSceneCamera(page, "OrthographicCamera");
      await living.focus();
      await page.waitForFunction(() =>
        [...window.sceneCameraProbe.roots.values()].some((root) =>
          root.store.getState().scene.getObjectByName("wall-finish-highlight"),
        ),
      );
      await page.screenshot({ path: "/tmp/cabane-wall-face-controls.png" });
      await living.blur();
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.getByRole("button", { name: "Save anyway", exact: true }).click();
      await page
        .getByRole("button", { name: "Save anyway", exact: true })
        .waitFor({ state: "hidden" });
      // Save exits Construct asynchronously. Reopen the saved workspace only after
      // that navigation settles, rather than racing a reload against it.
      await page.waitForURL((url) => /^\/workspaces\/[^/]+$/.test(url.pathname));
      await page.goto(`${page.url()}/construct`);
      await waitForSceneCamera(page, "OrthographicCamera");
      await page.getByRole("button", { name: "Select", exact: true }).click();
      await selectDivider();
      assert.equal(await living.inputValue(), "#aabbcc");
      assert.equal(await kitchen.inputValue(), "#223344");
      await page.getByRole("button", { name: "Reset kitchen side color", exact: true }).click();
      assert.notEqual(await kitchen.inputValue(), "#223344");
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await selectDivider();
      assert.equal(await kitchen.inputValue(), "#223344");
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }),
);

import assert from "node:assert/strict";
import test from "node:test";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

test(
  "basements use existing floor controls on desktop and mobile, with persistence and undo",
  { timeout: 120_000 },
  async () => {
    const { server } = await getBrowserTestServer("app");
    let browser;
    try {
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${server.resolvedUrls.local[0]}build`);
      const current = page.getByRole("button", { name: "Current floor", exact: true });
      await current.waitFor();
      await page.waitForFunction(
        () => !document.querySelector(".construct-floor-controls__trigger")?.disabled,
      );
      await current.click();
      await page.getByRole("menuitem", { name: "Add floor below", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(".construct-floor-controls__trigger")?.textContent === "Floor −1",
      );
      assert.equal(
        await page.getByRole("checkbox", { name: "Show floor above", exact: true }).isChecked(),
        true,
      );
      assert.equal(
        await page.getByRole("checkbox", { name: "Show floor below", exact: true }).count(),
        0,
      );
      await current.click();
      await page.keyboard.press("End");
      assert.equal(
        await page.evaluate(() => document.activeElement?.textContent),
        "Add floor below",
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          document.querySelector(".construct-floor-controls__trigger")?.textContent === "Floor −2",
      );
      await page.getByRole("button", { name: "Floor settings", exact: true }).click();
      await page.getByLabel("Floor name", { exact: true }).fill("Cellar");
      await page.getByLabel("Floor-to-floor height (m)", { exact: true }).fill("3");
      await page.getByRole("button", { name: "Save floor", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(".construct-floor-controls__trigger")?.textContent === "Cellar",
      );
      await current.click();
      await page.screenshot({ path: "/tmp/cabane-basement-desktop.png" });
      await page.keyboard.press("Escape");
      assert.equal(await current.getAttribute("aria-expanded"), "false");
      // A real drawing round-trip must retain the basement flag.
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
      await page.waitForTimeout(600);
      await page.reload();
      await current.waitFor();
      await page.waitForFunction(
        () => !document.querySelector(".construct-floor-controls__trigger")?.disabled,
      );
      assert.equal(await current.textContent(), "Ground floor");
      await current.click();
      await page.getByRole("menuitemradio", { name: "Cellar", exact: true }).click();
      await page.getByRole("button", { name: "Floor settings", exact: true }).click();
      assert.equal(
        await page.getByLabel("Floor-to-floor height (m)", { exact: true }).inputValue(),
        "3",
      );
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      await current.click();
      await page.screenshot({ path: "/tmp/cabane-basement-mobile.png" });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.getByRole("menuitemradio", { name: "Floor −1", exact: true }).click();
      const above = page.getByRole("checkbox", { name: "Show floor above", exact: true });
      const below = page.getByRole("checkbox", { name: "Show floor below", exact: true });
      assert.equal(await above.isChecked(), true);
      assert.equal(await below.isChecked(), true);
      await above.uncheck();
      assert.equal(await below.isChecked(), true);
      await above.check();
      await page.screenshot({ path: "/tmp/cabane-basement-both-guides-mobile.png" });
      await page.getByRole("button", { name: "Floor settings", exact: true }).click();
      assert.equal(
        await page.getByRole("button", { name: "Delete floor", exact: true }).isDisabled(),
        true,
      );
      assert.match(await page.getByRole("dialog").innerText(), /lowest basement/);
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await current.click();
      await page.getByRole("menuitemradio", { name: "Cellar", exact: true }).click();
      await page.getByRole("button", { name: "Floor settings", exact: true }).click();
      await page.getByRole("button", { name: "Delete floor", exact: true }).click();
      await page.getByRole("button", { name: "Remove floor", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(".construct-floor-controls__trigger")?.textContent === "Floor −1",
      );
      await page.getByRole("button", { name: /^Undo/ }).click();
      await current.click();
      assert.equal(
        await page.getByRole("menuitemradio", { name: "Cellar", exact: true }).count(),
        1,
      );
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /^Redo/ }).click();
      await current.click();
      assert.equal(
        await page.getByRole("menuitemradio", { name: "Cellar", exact: true }).count(),
        0,
      );
      await page.getByRole("menuitemradio", { name: "Ground floor", exact: true }).click();
      await page.getByRole("button", { name: "Floor settings", exact: true }).click();
      assert.equal(
        await page.getByRole("button", { name: "Delete floor", exact: true }).isDisabled(),
        true,
      );
      assert.match(await page.getByRole("dialog").innerText(), /ground floor cannot be deleted/);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  },
);

test(
  "imported basements render in the normal dashboard and Walk",
  { timeout: 60_000 },
  async () => {
    const { server } = await getBrowserTestServer("app");
    let browser;
    try {
      const { makeStairProject } = await server.ssrLoadModule(
        `${process.cwd()}/tests/fixtures/multiple-floors.ts`,
      );
      const { createSeedProjectRecord } = await server.ssrLoadModule(
        `${process.cwd()}/packages/engine/src/home-project/repository.ts`,
      );
      const project = makeStairProject();
      project.floors = project.floors.map((floor, i) => ({
        ...floor,
        name: ["Floor −2", "Floor −1", "Ground floor"][i],
        ...(i < 2 ? { belowGround: true } : {}),
      }));
      project.stairs.push({
        ...project.stairs[0],
        id: "upper-stairs",
        lowerFloorId: "first",
        upperFloorId: "second",
        at: [2, 1.5],
      });
      const record = createSeedProjectRecord(project);
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${server.resolvedUrls.local[0]}workspaces`);
      await page.getByRole("button", { name: "Import workspace", exact: true }).click();
      await page.getByLabel("Cabane JSON file").setInputFiles({
        name: "basements.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(record)),
      });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Import workspace", exact: true })
        .click();
      await page.getByRole("button", { name: "View", exact: true }).waitFor();
      const daylight = page.getByRole("button", { name: "Use daylight", exact: true });
      if (await daylight.count()) await daylight.click();
      await page.getByRole("button", { name: "View", exact: true }).click();
      await page.getByRole("button", { name: "Show roof", exact: true }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/cabane-basement-whole.png" });
      await page.locator(".floor-picker").hover();
      await page.getByRole("button", { name: "Floor −1", exact: true }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/cabane-basement-cutaway.png" });
      await page.getByRole("button", { name: "Walk mode", exact: true }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/cabane-basement-walk.png" });
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  },
);

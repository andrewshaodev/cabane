import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { startFixtureServer, serverOrigin } from "./fixture-server.mjs";
const server = await startFixtureServer({ port: 4190 });
let browser;
try {
  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${serverOrigin(server)}/tests/multiple-floor-editor-harness.html`);
  await page.getByRole("button", { name: "first floor", exact: true }).press("Space");
  await page.waitForTimeout(250);
  assert.equal(await page.getByRole("checkbox", { name: "Show floor below" }).isChecked(), true);
  await page.getByRole("button", { name: "Floor", exact: true }).click();
  await page.getByRole("button", { name: "Terracotta", exact: true }).click();
  await page.mouse.click(650, 400);
  await page.waitForTimeout(500);
  const painted = await page.evaluate(() => window.readFixtureProject());
  assert.equal(
    painted.floors[1].rooms[0].floorFinish?.preset,
    "terracotta-tile",
    "upper floor paint is saved",
  );
  assert.notEqual(
    painted.floors[0].rooms[0].floorFinish?.preset,
    "terracotta-tile",
    "lower floor paint stays unchanged",
  );
  const assertVisiblePattern = async () => {
    const png = await page.screenshot({ clip: { x: 600, y: 600, width: 100, height: 100 } });
    const colors = await page.evaluate(async (bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
      );
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      const data = context.getImageData(0, 0, 100, 100).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 4)
        colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      bitmap.close();
      return colors.size;
    }, Array.from(png));
    assert.ok(
      colors > 10,
      `Painted pattern is visible, not a flat shader fallback (${colors} colors)`,
    );
  };
  await assertVisiblePattern();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("dialog", { name: "Explore draft" }).waitFor();
  await page.locator(".mode-walk").waitFor();
  await page.waitForTimeout(750);
  assert.equal(
    await page.getByRole("dialog", { name: "Explore draft" }).count(),
    1,
    "Explore stays open with pointer lock",
  );
  assert.equal(
    await page.evaluate(() => Boolean(document.pointerLockElement)),
    true,
    "Explore locks pointer",
  );
  assert.equal(await page.getByText("WASD or arrows to walk", { exact: false }).count(), 0);
  const canvas = page.locator(".direction-preview-dialog canvas");
  const before = await canvas.screenshot();
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  const moved = await canvas.screenshot();
  assert.ok(!before.equals(moved), "W moves the rendered view with pointer lock");
  await page.mouse.move(1000, 520, { steps: 12 });
  const looked = await canvas.screenshot();
  assert.ok(!moved.equals(looked), "mouse motion changes the rendered view with pointer lock");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Explore draft" }).waitFor({ state: "detached" });
  assert.equal(await page.getByRole("dialog", { name: "Explore draft" }).count(), 0);
  assert.deepEqual(errors, []);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.mouse.click(1200, 700);
  await assertVisiblePattern();
  await page.screenshot({ path: "/tmp/cabane-multifloor-fixed.png" });
  // Painting disables stair hit testing; switching back to Select must restore it.
  await page.mouse.click(835, 460);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  await page.getByRole("button", { name: "Ground floor", exact: true }).press("Space");
  await page.waitForTimeout(250);
  await page.mouse.click(835, 460);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  await page.getByRole("button", { name: "first floor", exact: true }).press("Space");
  await page.waitForTimeout(250);

  await page.getByRole("button", { name: "Stairs", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.getByRole("button", { name: "Cancel stairs", exact: true }).count(),
    0,
    "Escape cancels before drawing",
  );
  await page.getByRole("button", { name: "Stairs", exact: true }).click();
  await page.mouse.move(680, 650);
  await page.mouse.down();
  await page.mouse.move(700, 330);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.equal(
    (await page.evaluate(() => window.readFixtureProject())).stairs.length,
    1,
    "Escape during a drag adds nothing",
  );
  assert.equal(await page.getByRole("button", { name: "Cancel stairs", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Stairs", exact: true }).click();
  await page.mouse.click(680, 650);
  assert.equal(
    (await page.evaluate(() => window.readFixtureProject())).stairs.length,
    1,
    "a click alone adds nothing",
  );
  await page.mouse.move(760, 330);
  await page.locator(".stair-placement-error").waitFor();
  await page.mouse.click(760, 330);
  await page.locator(".stair-placement-error").waitFor();
  assert.equal(
    (await page.evaluate(() => window.readFixtureProject())).stairs.length,
    2,
    "invalid placement persists as an editable draft",
  );
  await page.getByRole("button", { name: "Delete stairs", exact: true }).click();
  await page.getByRole("button", { name: "Stairs", exact: true }).click();
  await page.mouse.move(680, 650);
  await page.mouse.down();
  await page.mouse.move(700, 330);
  await page.waitForTimeout(150);
  const stairPreview = await page.screenshot({ clip: { x: 620, y: 290, width: 190, height: 410 } });
  await page.mouse.up();
  const details = page.getByRole("complementary", { name: "Stair properties" });
  await details.waitFor();
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "stairs use a details panel, not a modal",
  );
  const placedStair = await page.screenshot({ clip: { x: 620, y: 290, width: 190, height: 410 } });
  assert.ok(!stairPreview.equals(placedStair), "placing selects and colors the staircase");
  const placedProject = await page.evaluate(() => window.readFixtureProject());
  assert.equal(placedProject.stairs.length, 2, "drag and release places stairs directly");
  assert.ok(
    Math.abs(Math.abs(placedProject.stairs.at(-1).rotationYRadians) - Math.PI) < 0.001,
    "near-vertical stair snaps to the Construct right angle",
  );
  assert.match(
    await details.getByRole("spinbutton", { name: "Length (m)", exact: true }).inputValue(),
    /^\d+(\.\d{1,2})?$/,
  );
  assert.equal(
    await details
      .getByRole("spinbutton", { name: "Start X (plan units)", exact: true })
      .isVisible(),
    false,
    "advanced position starts collapsed",
  );
  await page.screenshot({ path: "/tmp/cabane-stair-details.png" });
  // Body drag preserves dimensions and stays one history entry.
  const originalStair = placedProject.stairs.at(-1);
  await page.mouse.move(677, 425);
  await page.mouse.down();
  await page.mouse.move(617, 425, { steps: 8 });
  await page.getByText("second floor · reference", { exact: true }).waitFor();
  await page.mouse.up();
  await page.waitForFunction(
    async (before) =>
      JSON.stringify((await window.readFixtureProject()).stairs.at(-1).at) !==
      JSON.stringify(before),
    originalStair.at,
  );
  const movedStair = (await page.evaluate(() => window.readFixtureProject())).stairs.at(-1);
  assert.equal(movedStair.runMeters, originalStair.runMeters);
  assert.equal(movedStair.widthMeters, originalStair.widthMeters);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(
    async (before) =>
      JSON.stringify((await window.readFixtureProject()).stairs.at(-1).at) ===
      JSON.stringify(before),
    originalStair.at,
  );
  await page.waitForTimeout(150);
  await page.mouse.click(677, 425);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor();
  await page.waitForTimeout(150);
  await page.screenshot({ path: "/tmp/stair-before-resize.png" });
  // Resize the top while bottom stays anchored, then cancel another gesture.
  await page.mouse.move(677, 326);
  await page.mouse.down();
  await page.mouse.move(677, 500, { steps: 8 });
  await page.screenshot({ path: "/tmp/stair-resizing.png" });
  await page.locator(".stair-placement-error").first().waitFor();
  await page.mouse.up();
  await page.waitForFunction(
    async (run) => (await window.readFixtureProject()).stairs.at(-1).runMeters < run,
    originalStair.runMeters,
  );
  const resized = (await page.evaluate(() => window.readFixtureProject())).stairs.at(-1);
  assert.deepEqual(resized.at, originalStair.at);
  await page.mouse.move(677, 560);
  await page.mouse.down();
  await page.mouse.move(617, 560, { steps: 5 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual((await page.evaluate(() => window.readFixtureProject())).stairs.at(-1), resized);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(
    async (run) => (await window.readFixtureProject()).stairs.at(-1).runMeters === run,
    originalStair.runMeters,
  );
  await page.waitForTimeout(150);
  await page.mouse.click(677, 425);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor();
  await page.waitForTimeout(150);
  // Side handles shrink width symmetrically without changing the run.
  await page.mouse.move(716, 488);
  await page.mouse.down();
  await page.mouse.move(693, 488, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(
    async (width) => (await window.readFixtureProject()).stairs.at(-1).widthMeters < width,
    originalStair.widthMeters,
  );
  assert.deepEqual(
    (await page.evaluate(() => window.readFixtureProject())).stairs.at(-1).at,
    originalStair.at,
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(
    async (width) => (await window.readFixtureProject()).stairs.at(-1).widthMeters === width,
    originalStair.widthMeters,
  );
  await page.waitForTimeout(150);
  await page.mouse.click(677, 425);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor();
  await page.waitForTimeout(150);
  await page.setViewportSize({ width: 600, height: 760 });
  const removeVisible = await page
    .getByRole("button", { name: "Delete stairs", exact: true })
    .evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return button.contains(
        document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
      );
    });
  assert.equal(
    removeVisible,
    true,
    "stair removal must be above the room inspector in narrow layouts",
  );
  await page.setViewportSize({ width: 1400, height: 1000 });

  assert.equal(
    await page.getByRole("button", { name: "Remove stairs", exact: true }).count(),
    0,
    "duplicate delete button removed",
  );
  await page.getByRole("button", { name: "Go to second floor", exact: true }).click();
  await page.waitForTimeout(250);
  await page.mouse.move(677, 425);
  await page.mouse.down();
  await page.mouse.move(617, 425, { steps: 8 });
  await page.getByText("first floor · reference", { exact: true }).waitFor();
  await page.mouse.up();
  await page.waitForFunction(
    async (before) =>
      JSON.stringify((await window.readFixtureProject()).stairs.at(-1).at) !==
      JSON.stringify(before),
    originalStair.at,
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(
    async (before) =>
      JSON.stringify((await window.readFixtureProject()).stairs.at(-1).at) ===
      JSON.stringify(before),
    originalStair.at,
  );
  await page.waitForTimeout(150);
  await page.mouse.click(677, 425);
  await page.getByRole("complementary", { name: "Stair properties" }).waitFor();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Go to first floor", exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Delete stairs", exact: true }).click();
  await page.waitForFunction(async () => (await window.readFixtureProject()).stairs.length === 1);
  assert.equal(
    (await page.evaluate(() => window.readFixtureProject())).stairs.length,
    1,
    "floating action deletes the selected stair",
  );
  assert.equal(
    await page.getByRole("group", { name: "Selected stair actions", exact: true }).count(),
    0,
  );
  await page.evaluate(() => {
    HTMLElement.prototype.requestPointerLock = () => Promise.reject(new Error("Denied"));
  });
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Allow pointer lock" }).waitFor();
  assert.equal(
    await page.getByRole("dialog", { name: "Explore draft" }).count(),
    0,
    "denied pointer lock does not enter first person",
  );
  await page.evaluate(() =>
    sessionStorage.setItem(
      "cabane-scene-session",
      JSON.stringify({ mode: "overview", selectedRoomId: null, wallFadeEnabled: false }),
    ),
  );
  await page.goto(`${serverOrigin(server)}/tests/agent-harness.html?stage=building`);
  await page.locator(".floor-picker__level").first().focus();
  await page.getByRole("button", { name: "Show roof", exact: true }).click();
  await page.waitForTimeout(750);
  await page.screenshot({ path: "/tmp/cabane-building-exterior-fixed.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Multi-floor UI passed: drawing gestures, live errors, invalid drafts, movement on both floors, resize handles, cancellation, undo, overlays, narrow layout, Explore and roof.",
  );
} finally {
  await browser?.close();
  await server.close();
}

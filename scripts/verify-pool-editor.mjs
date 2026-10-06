import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const origin = process.env.EDITOR_ORIGIN ?? "http://127.0.0.1:4319";
const output = await mkdtemp(join(tmpdir(), "cabane-pool-evidence-"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  // Normal UI against an isolated browser context; never alter the owner's saved home.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/construct`, { waitUntil: "networkidle" });
  await page.getByText("Draft saved locally", { exact: true }).waitFor();
  const record = () =>
    page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("cabane-projects-v2", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const rows = await new Promise((resolve, reject) => {
        const request = db.transaction("home-projects").objectStore("home-projects").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return JSON.parse(rows[0]);
    });
  const waitRecord = async (predicate) => {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const next = await record();
      if (predicate(next)) return next;
      await page.waitForTimeout(80);
    }
    throw new Error("Expected saved pool state did not arrive.");
  };
  const initial = await record();
  const floor = initial.draft.floor;
  const bounds = await page.getByLabel("Home editor canvas", { exact: true }).boundingBox();
  const xs = floor.footprint.map((p) => p[0]),
    zs = floor.footprint.map((p) => p[1]);
  const width = Math.max(...xs) - Math.min(...xs),
    depth = Math.max(...zs) - Math.min(...zs);
  const scale = floor.coordinates.metersPerPlanUnit;
  const zoom = Math.max(
    8,
    Math.min(110, bounds.width / (width * scale * 1.48), bounds.height / (depth * scale * 1.58)),
  );
  const screen = ([x, z]) => [
    bounds.x + bounds.width / 2 + (x - (Math.min(...xs) + width / 2)) * scale * zoom,
    bounds.y + bounds.height / 2 + (z - (Math.min(...zs) + depth / 2)) * scale * zoom,
  ];
  const click = async (point) => page.mouse.click(...screen(point));
  const corners = [
    [2, -3],
    [5, -3],
    [5, -1],
    [2, -1],
  ];

  await page.keyboard.press("p");
  assert.equal(
    await page.getByRole("button", { name: "Pool", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  for (const corner of corners.slice(0, 3)) await click(corner);
  assert.equal(await page.getByRole("button", { name: "Apply", exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Explore", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  assert.equal((await record()).draft.floor.pools?.length ?? 0, 0);
  await page.screenshot({ path: join(output, "pool-drawing.png") });
  await click(corners[3]);
  await click(corners[0]);
  const added = await waitRecord((r) => r.draft.floor.pools?.length === 1);
  assert.equal(added.draft.floor.pools[0].polygon.length, corners.length);
  added.draft.floor.pools[0].polygon.forEach((point, index) =>
    point.forEach((value, axis) =>
      assert.ok(
        Math.abs(value - corners[index][axis]) < 0.11 / scale,
        "outline follows the metric grid at the floor's calibrated scale",
      ),
    ),
  );
  for (const key of ["rooms", "walls", "wallJunctions", "openings", "ceilings", "footprint"])
    assert.deepEqual(added.draft.floor[key], initial.draft.floor[key], key);
  assert.deepEqual(added.published, initial.published);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await waitRecord((r) => !r.draft.floor.pools?.length);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await waitRecord((r) => r.draft.floor.pools?.length === 1);
  await page.keyboard.press("v");
  await click([3.5, -2]);
  const cornerX = page.getByLabel("Pool corner 1 X", { exact: true });
  await cornerX.fill("2.4");
  await cornerX.press("Tab");
  await waitRecord((r) => r.draft.floor.pools[0].polygon[0][0] === 2.4);
  await page.mouse.move(...screen([3.5, -2]));
  await page.mouse.down();
  await page.mouse.move(...screen([4, -2]), { steps: 8 });
  await page.mouse.up();
  const moved = await waitRecord(
    (r) => Math.abs(r.draft.floor.pools[0].polygon[0][0] - 2.9) < 0.11 / scale,
  );
  await page.mouse.move(...screen(moved.draft.floor.pools[0].polygon[2]));
  await page.mouse.down();
  await page.mouse.move(...screen([5.5, -0.8]), { steps: 8 });
  await page.mouse.up();
  const reshaped = await waitRecord(
    (r) => Math.abs(r.draft.floor.pools[0].polygon[2][1] + 0.8) < 0.11 / scale,
  );
  await page.screenshot({ path: join(output, "pool-selected-plan.png") });
  const originalX = reshaped.draft.floor.pools[0].polygon[0][0];
  await cornerX.fill("6");
  await cornerX.press("Tab");
  await waitRecord((r) => r.draft.floor.pools[0].polygon[0][0] === 6);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: /^Apply (changes|anyway)$/ }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Draft saved locally", { exact: true }).waitFor();
  assert.equal((await record()).draft.floor.pools[0].polygon[0][0], 6, "invalid draft resumes");
  assert.deepEqual((await record()).published, initial.published);
  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await page.getByRole("button", { name: added.draft.floor.pools[0].id, exact: true }).click();
  await page.getByLabel("Pool corner 1 X", { exact: true }).fill(String(originalX));
  await page.getByLabel("Pool corner 1 X", { exact: true }).press("Tab");
  await waitRecord((r) => r.draft.floor.pools[0].polygon[0][0] === originalX);
  await page.getByRole("button", { name: "Delete pool", exact: true }).click();
  await waitRecord((r) => !r.draft.floor.pools?.length);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await waitRecord((r) => r.draft.floor.pools?.length === 1);
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(output, "pool-arrange-3d.png") });
  const orbit = await page.getByLabel("Home editor canvas", { exact: true }).boundingBox();
  await page.mouse.move(orbit.x + orbit.width * 0.2, orbit.y + orbit.height * 0.6);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(
    orbit.x + orbit.width * 0.2 + orbit.height * 0.5,
    orbit.y + orbit.height * 0.48,
    { steps: 20 },
  );
  await page.mouse.up({ button: "right" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(output, "pool-grazing-orbit.png") });
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("dialog", { name: "Explore draft", exact: true }).waitFor();
  // Read the live camera only to observe normal keyboard/mouse navigation. Never set scene or camera state.
  const walkPose = () =>
    page.evaluate(async () => {
      const source = performance
        .getEntriesByType("resource")
        .find((entry) => entry.name.includes("/@react-three_fiber.js"))?.name;
      if (!source) return null;
      const { _roots } = await import(source);
      const state = _roots
        .get(document.querySelector(".direction-preview-dialog canvas"))
        ?.store.getState();
      if (!state?.camera.isPerspectiveCamera) return null;
      return {
        x: state.camera.position.x,
        z: state.camera.position.z,
        yaw: state.camera.rotation.y,
        pitch: state.camera.rotation.x,
      };
    });
  for (let tries = 0; tries < 100 && !(await walkPose()); tries++) await page.waitForTimeout(100);
  assert.ok(await walkPose(), "Explore's walk camera mounted");
  console.log("Walk spawn:", await walkPose());
  await page.screenshot({ path: join(output, "pool-explore-walk.png") });
  const walkTo = async (key, axis, target, increasing) => {
    const deadline = Date.now() + 12_000;
    await page.keyboard.down(key);
    try {
      while (Date.now() < deadline) {
        const pose = await walkPose();
        if (increasing ? pose[axis] >= target : pose[axis] <= target) return;
        await page.waitForTimeout(80);
      }
      throw new Error(
        `Walk ${key} did not reach ${axis}=${target}: ${JSON.stringify(await walkPose())}`,
      );
    } finally {
      await page.keyboard.up(key);
      await page.waitForTimeout(200);
    }
  };
  const worldX = (x) => (x - floor.coordinates.origin[0]) * scale;
  const worldZ = (z) => (z - floor.coordinates.origin[1]) * scale;
  await walkTo("a", "x", worldX(5.6), true);
  await walkTo("s", "z", worldZ(-0.1), false);
  await walkTo("a", "x", worldX(6.5), true);
  await walkTo("s", "z", worldZ(-1.8), false);
  // Turn left toward the pool and look slightly down, using ordinary mouse movement.
  const mouseBefore = await page
    .getByRole("button", { name: "Explore", exact: true })
    .boundingBox();
  await page.mouse.move(
    mouseBefore.x + mouseBefore.width / 2 + Math.PI / 2 / 0.0024,
    mouseBefore.y + mouseBefore.height / 2 + 0.4 / 0.002,
    { steps: 20 },
  );
  await page.waitForTimeout(500);
  console.log("Pool-edge walk:", await walkPose());
  await page.screenshot({ path: join(output, "pool-grazing-walk.png") });
  // Forward into the pool must stop at the buffered edge, not enter the water.
  await page.keyboard.down("w");
  await page.waitForTimeout(2200);
  await page.keyboard.up("w");
  await page.waitForTimeout(200);
  const stopped = await walkPose();
  const eastEdge = worldX(reshaped.draft.floor.pools[0].polygon[2][0]);
  assert.ok(
    stopped.x >= eastEdge + 0.46 && stopped.x < eastEdge + 0.7,
    `Pool rim collision: ${JSON.stringify(stopped)}`,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.getByRole("button", { name: /^Apply (changes|anyway)$/ }).click();
  await page.locator(".cabane-shell").waitFor();
  await waitRecord((r) => r.published.floor.pools?.length === 1);
  await page.screenshot({ path: join(output, "pool-home-overview.png") });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".cabane-shell").waitFor();
  assert.equal((await record()).published.floor.pools.length, 1);

  const touchContext = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const touch = await touchContext.newPage();
  touch.on("pageerror", (error) => errors.push(error.message));
  await touch.goto(`${origin}/construct`, { waitUntil: "networkidle" });
  await touch.getByText("Draft saved locally", { exact: true }).waitFor();
  const touchBounds = await touch.getByLabel("Home editor canvas", { exact: true }).boundingBox();
  const touchZoom = Math.max(
    8,
    Math.min(
      110,
      touchBounds.width / (width * scale * 1.48),
      touchBounds.height / (depth * scale * 1.58),
    ),
  );
  const touchScreen = ([x, z]) => [
    touchBounds.x + touchBounds.width / 2 + (x - (Math.min(...xs) + width / 2)) * scale * touchZoom,
    touchBounds.y +
      touchBounds.height / 2 +
      (z - (Math.min(...zs) + depth / 2)) * scale * touchZoom,
  ];
  await touch.getByRole("button", { name: "Pool", exact: true }).tap();
  const touchCorners = [
    [2, -3],
    [5, -3],
    [5, -1.5],
    [2, -1.5],
  ];
  for (const corner of [...touchCorners, touchCorners[0]])
    await touch.touchscreen.tap(...touchScreen(corner));
  assert.equal(await touch.getByRole("button", { name: "Apply", exact: true }).isEnabled(), true);
  await touch.getByRole("button", { name: "Select", exact: true }).tap();
  await touch.touchscreen.tap(...touchScreen([3.5, -2]));
  assert.ok(
    Math.abs(Number(await touch.getByLabel("Pool corner 4 X", { exact: true }).inputValue()) - 2) <
      0.11 / scale,
  );
  assert.ok(
    Math.abs(
      Number(await touch.getByLabel("Pool corner 3 Y", { exact: true }).inputValue()) + 1.5,
    ) <
      0.11 / scale,
  );
  await touch.screenshot({ path: join(output, "pool-touch-plan.png") });
  await touch.setViewportSize({ width: 390, height: 844 });
  await touch.getByLabel("Pool corner 1 X", { exact: true }).fill("2.3");
  await touch.getByLabel("Pool corner 1 X", { exact: true }).press("Tab");
  await touch.screenshot({ path: join(output, "pool-phone-inspector.png") });
  assert.equal(
    await touch.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Verified desktop and touch Pool drawing/closure, history, drag/corner edits, invalid-draft recovery, deletion, pool-edge walk collision, Apply and reload through the normal UI.",
  );
  console.log(`Screenshots: ${output}`);
} catch (error) {
  console.error(`Pool evidence directory: ${output}`);
  console.error(`Browser errors: ${JSON.stringify(errors)}`);
  throw error;
} finally {
  await browser.close();
}

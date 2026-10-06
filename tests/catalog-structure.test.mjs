import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const exists = async (path) => access(path).then(() => true, () => false);

test("stores reusable models in the consolidated catalog", async () => {
  assert.equal(await exists("packages/catalog/src/architecture/index.ts"), true);
  assert.equal(await exists("packages/catalog/src/furnishing/index.ts"), true);
  assert.equal(await exists("packages/catalog/src/furnishing/registry.tsx"), true);
  assert.equal(await exists("packages/catalog/src/device/index.ts"), true);
  assert.equal(await exists("packages/engine/src/opening-models"), false);
  assert.equal(await exists("packages/device-catalog"), false);
  assert.equal(await exists("packages/catalog/src/device/presets/media/television.tsx"), true);
  assert.equal(await exists("packages/catalog/src/device/presets/lighting/floor-lamp.tsx"), true);
  assert.equal(await exists("home/src/extensions/devices/living-room-tv.tsx"), false);
  assert.equal(await exists("home/src/extensions/devices/living-room-floor-lamp.tsx"), false);
});

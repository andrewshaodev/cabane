import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { scaleFixtureManifest, scaleFixtureProfile } = await load(
    "/tests/fixtures/agent-home.tsx",
  );
  const { collectBindingSlots, validateRuntimeBindingProfile, deriveFloorLevels } = await load(
    "/packages/engine/src/index.ts",
  );
  test("keeps 20 rooms and 100 bindings across four selected floors", () => {
    const source = scaleFixtureManifest.floors[0];
    const floors = Array.from({ length: 4 }, (_, index) => ({
      ...source,
      id: `level-${index}`,
      rooms: source.rooms.slice(index * 5, index * 5 + 5),
    }));
    const manifest = { ...scaleFixtureManifest, floors };
    assert.equal(floors.flatMap((floor) => floor.rooms).length, 20);
    const slots = collectBindingSlots(manifest);
    assert.equal(slots.length, 100);
    assert.equal(new Set(slots.map((slot) => slot.slotId)).size, 100);
    assert.equal(validateRuntimeBindingProfile(scaleFixtureProfile, manifest).valid, true);
    assert.deepEqual(
      deriveFloorLevels(floors).map((level) => Math.round(level.elevationMeters * 10)),
      [0, 26, 52, 78],
    );
    for (const floor of floors)
      assert.equal(
        slots.filter((slot) => floor.rooms.some((room) => slot.roomIds.includes(room.id))).length,
        25,
      );
  });
});

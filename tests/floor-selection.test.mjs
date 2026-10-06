import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { reconcileFloorSelection, adjacentFloorId, visibleFloorIds } = await load(
    "/packages/engine/src/building/index.ts",
  );
  test("starts on ground, retains existing selection, and falls back below a removed floor", () => {
    const order = ["ground", "first", "second"];
    assert.equal(
      reconcileFloorSelection({ activeFloorId: "", wholeBuilding: false }, order, order)
        .activeFloorId,
      "ground",
    );
    assert.equal(
      reconcileFloorSelection(
        { activeFloorId: "second", wholeBuilding: false },
        order,
        order.slice(0, 2),
      ).activeFloorId,
      "first",
    );
    assert.equal(adjacentFloorId(order, "ground", -1), null);
    assert.deepEqual(visibleFloorIds(order, "first", "plan"), ["first"]);
    assert.deepEqual(visibleFloorIds(order, "first", "cutaway"), ["ground", "first"]);
    assert.deepEqual(visibleFloorIds(order, "first", "whole"), order);
  });
});

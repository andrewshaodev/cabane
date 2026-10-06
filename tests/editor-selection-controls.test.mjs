import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    itemRotation,
    normalizeRotation,
    rotationDelta,
    selectionRingRadius,
    selectionToolbarPosition,
  } = await load("/apps/web/src/editor-preview/furnish/selection-geometry.ts");
  const { duplicateSceneItem } = await load(
    "/apps/web/src/editor-preview/furnish/duplicate-item.ts",
  );
  const { createFurnishingEditorState, furnishingEditorReducer: reduce } = await load(
    "/apps/web/src/editor-preview/furnish/editor-state.ts",
  );
  const item = {
    id: "chair",
    kind: "furnishing",
    modelId: "chair",
    size: [2, 1, 0.5],
    placement: { kind: "absolute", at: [12, 22], elevationMeters: 0, rotationYRadians: 0 },
  };
  const floor = {
    coordinates: { origin: [10, 20], metersPerPlanUnit: 0.5 },
    rooms: [
      {
        id: "room",
        polygon: [
          [10, 20],
          [20, 20],
          [20, 30],
          [10, 30],
        ],
      },
    ],
    walls: [{ id: "wall", from: [10, 20], to: [20, 20], thicknessMeters: 0.1 }],
    defaultWallHeightMeters: 2.5,
  };

  test("rotation crosses the angle seam smoothly and respects wall-relative yaw", () => {
    assert.ok(Math.abs(rotationDelta(-Math.PI + 0.01, Math.PI - 0.01) - 0.02) < 1e-10);
    assert.ok(Math.abs(normalizeRotation(-Math.PI / 12) - (Math.PI * 23) / 12) < 1e-10);
    assert.equal(itemRotation({ kind: "wall", rotationOffsetRadians: 0.6 }), 0.6);
    assert.equal(itemRotation({ kind: "ceiling", rotationYRadians: 0.3 }), 0.3);
  });

  test("a rotation drag commits one undo step; cancellation commits none", () => {
    let state = createFurnishingEditorState([item]);
    state = reduce(state, { type: "select", id: item.id });
    const original = state;
    state = reduce(state, { type: "begin-transaction" });
    for (const rotationYRadians of [0.1, 0.2, 0.3])
      state = reduce(state, { type: "rotate", id: item.id, rotationYRadians });
    assert.equal(state.past.length, 0);
    const cancelled = reduce(state, { type: "cancel-transaction" });
    assert.deepEqual(cancelled.items, original.items);
    assert.equal(cancelled.past.length, 0);
    state = reduce(state, { type: "commit-transaction" });
    assert.equal(state.past.length, 1);
    state = reduce(state, { type: "undo" });
    assert.equal(itemRotation(state.items[0].placement), 0);
    state = reduce(state, { type: "redo" });
    assert.equal(itemRotation(state.items[0].placement), 0.3);
  });

  test("ring encloses scaled asymmetric bounds around the actual item pivot", () => {
    const radius = selectionRingRadius(
      { ...item, size: [4, 2, 1] },
      {
        defaultSize: [2, 1, 0.5],
        bounds: { min: [-0.25, 0, -0.2], max: [1.75, 1, 0.3] },
      },
    );
    assert.ok(radius > Math.hypot(3.5, 0.6));
  });

  test("toolbar stays inside the viewport and below header when the item is near the top", () => {
    const position = selectionToolbarPosition({
      centerX: 390,
      itemTop: 80,
      itemBottom: 120,
      width: 400,
      height: 300,
      toolbarWidth: 206,
      toolbarHeight: 56,
      topInset: 130,
    });
    assert.equal(position.x, 186);
    assert.equal(position.y, 138);
    const short = selectionToolbarPosition({
      centerX: 0,
      itemTop: 0,
      itemBottom: 110,
      width: 300,
      height: 120,
      toolbarWidth: 206,
      toolbarHeight: 56,
      topInset: 150,
    });
    assert.deepEqual(short, { x: 8, y: 56 });
  });

  test("copies use world metres and preserve ceiling supports near room edges", () => {
    const copy = duplicateSceneItem(item, [item], floor);
    assert.deepEqual(copy.placement.at, [12.5, 22.5]);
    assert.equal(copy.placement.rotationYRadians, 0);
    const ceiling = {
      ...item,
      placement: {
        kind: "ceiling",
        roomId: "room",
        at: [19.9, 29.9],
        dropMeters: 0.4,
        rotationYRadians: 0.5,
      },
    };
    const ceilingCopy = duplicateSceneItem(ceiling, [ceiling], floor);
    assert.equal(ceilingCopy.placement.kind, "ceiling");
    assert.equal(ceilingCopy.placement.roomId, "room");
    assert.deepEqual(ceilingCopy.placement.at, [19.4, 29.4]);
    assert.equal(ceilingCopy.placement.dropMeters, 0.4);
  });

  test("device copies have independent globally unique slot IDs and preserved roles", () => {
    const device = {
      ...item,
      kind: "device",
      entitySlots: [
        { id: "light-primary", deviceRole: "primary", compatibleDomains: ["light"] },
        { id: "light-battery", deviceRole: "battery", compatibleDomains: ["sensor"] },
      ],
    };
    const copy = duplicateSceneItem(device, [device], floor, ["light-primary-copy"]);
    const ids = [copy.id, ...copy.entitySlots.map((slot) => slot.id)];
    assert.equal(new Set(ids).size, 3);
    for (const id of ids)
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(
      ids.every(
        (id) => ![device.id, "light-primary", "light-battery", "light-primary-copy"].includes(id),
      ),
    );
    assert.deepEqual(
      copy.entitySlots.map((slot) => slot.deviceRole),
      ["primary", "battery"],
    );
    assert.notEqual(copy.entitySlots[0].compatibleDomains, device.entitySlots[0].compatibleDomains);
    const assignments = {
      "light-primary": "light.test_fixture",
      "light-battery": "sensor.test_fixture",
    };
    assert.ok(copy.entitySlots.every((slot) => assignments[slot.id] === undefined));
    assert.deepEqual(
      device.entitySlots.map((slot) => slot.id),
      ["light-primary", "light-battery"],
    );
  });

  test("Delete clears selection and Undo restores the selected furnishing", () => {
    let state = reduce(createFurnishingEditorState([item]), { type: "select", id: item.id });
    state = reduce(state, { type: "delete", id: item.id });
    assert.equal(state.selectedId, null);
    assert.equal(state.items.length, 0);
    state = reduce(state, { type: "undo" });
    assert.equal(state.selectedId, item.id);
    assert.deepEqual(state.items, [item]);
  });

  test("Delete removes a multi-slot device and Undo restores its exact identity", () => {
    const device = {
      ...item,
      id: "television",
      kind: "device",
      modelId: "television",
      entitySlots: [
        { id: "television-primary", deviceRole: "primary", compatibleDomains: ["media_player"] },
        { id: "television-secondary", deviceRole: "secondary", compatibleDomains: ["sensor"] },
      ],
    };
    let state = reduce(createFurnishingEditorState([device]), { type: "select", id: device.id });
    state = reduce(state, { type: "delete", id: device.id });
    assert.equal(state.selectedId, null);
    assert.deepEqual(state.items, []);
    state = reduce(state, { type: "undo" });
    assert.equal(state.selectedId, device.id);
    assert.deepEqual(state.items, [device]);
    state = reduce(state, { type: "redo" });
    assert.equal(state.selectedId, null);
    assert.deepEqual(state.items, []);
  });
});

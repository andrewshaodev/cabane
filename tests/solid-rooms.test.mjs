import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { SolidRooms } = await load("/packages/engine/src/architecture-scene/SolidRooms.tsx");
  const { deriveFloorTopology } = await load(
    "/packages/engine/src/home-editor/construct/topology.ts",
  );
  const { createFloorEditorDraft } = await load(
    "/packages/engine/src/home-editor/construct/create-floor-draft.ts",
  );
  const { deriveWalkColliders } = await load("/packages/engine/src/navigation/walk-colliders.ts");
  const { evaluateDerivedWalkNavigation } = await load(
    "/packages/engine/src/navigation/walk-connectivity.ts",
  );
  const { validateHomeManifest } = await load("/packages/engine/src/validation.ts");
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const input = {
    floorId: "ground",
    floorName: "Ground",
    rooms: [],
    openings: [],
    walls: [0, 1, 2, 3].flatMap((n) => [
      { id: `horizontal-${n}`, from: [0, n], to: [3, n] },
      { id: `vertical-${n}`, from: [n, 0], to: [n, 3] },
    ]),
  };
  const original = deriveFloorTopology(input).floor;
  const draft = createFloorEditorDraft(original);
  const center = draft.rooms.find(
    (room) => room.anchor[0] > 1 && room.anchor[0] < 2 && room.anchor[1] > 1 && room.anchor[1] < 2,
  );
  center.isSolid = true;
  const floor = deriveFloorTopology(draft).floor;

  test("a solid enclosed by shared walls preserves topology and is excluded from walk rooms", () => {
    assert.deepEqual(floor.walls, original.walls);
    assert.deepEqual(floor.footprint, original.footprint);
    assert.equal(floor.rooms.length, 9);
    const navigation = evaluateDerivedWalkNavigation(floor);
    assert.equal(
      navigation.rooms.some((room) => room.roomId === center.id),
      false,
    );
    const barriers = deriveWalkColliders(floor).filter((collider) =>
      collider.id.startsWith(`${center.id}-solid-`),
    );
    assert.equal(barriers.length, 4);
    assert.ok(barriers.every((barrier) => barrier.maxY === floor.defaultWallHeightMeters));
  });

  test("a runtime floor containing only solids is still valid architecture", () => {
    const result = validateHomeManifest({
      ...neutralDemoManifest,
      floors: [
        {
          ...floor,
          rooms: [],
          solidRooms: floor.rooms.map((room) => ({ ...room, isSolid: true })),
          ceilings: [],
        },
      ],
      sceneItems: [],
      stairs: [],
    });
    assert.equal(
      result.issues.some((issue) => issue.code === "rooms.required"),
      false,
    );
  });

  test("solid spaces render closed extruded geometry in both draft and runtime floors", async () => {
    for (const source of [
      floor,
      {
        ...floor,
        rooms: floor.rooms.filter((room) => !room.isSolid),
        solidRooms: floor.rooms.filter((room) => room.isSolid),
      },
    ]) {
      const renderer = await create(createElement(SolidRooms, { floor: source, color: "#dddddd" }));
      try {
        const mesh = renderer.scene.findByProps({ name: `solid-space-${center.id}` });
        const geometry = mesh.instance.geometry;
        geometry.computeBoundingBox();
        assert.ok(geometry.boundingBox.max.z > 2);
        assert.equal(geometry.boundingBox.min.z, 0);
        assert.equal(geometry.parameters.options.bevelEnabled, false);
        assert.ok(geometry.getAttribute("position").count > 24);
      } finally {
        await renderer.unmount();
      }
    }
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  const { useConstructEditor } = await load(
    "/apps/web/src/editor-preview/construct/useConstructEditor.ts",
  );
  test("painting after a floor switch updates the selected floor and preserves its rooms", async () => {
    const project = makeStairProject();
    let editor;
    function Probe() {
      editor = useConstructEditor(project.floors[0]);
      return null;
    }
    const renderer = await create(createElement(Probe));
    try {
      await act(async () => editor.replaceFloor(project.floors[1]));
      const room = editor.previewFloor.rooms[0];
      await act(async () =>
        editor.paintRoomFloor(room.id, { kind: "solid", color: "#ff0000" }, false),
      );
      assert.equal(editor.previewFloor.id, "first");
      assert.deepEqual(editor.previewFloor.rooms[0].floorFinish, {
        kind: "solid",
        color: "#ff0000",
      });
      assert.equal(editor.previewFloor.rooms[0].id, room.id);
    } finally {
      await renderer.unmount();
    }
  });
  const { WalkCameraController } = await load("/packages/engine/src/WalkCameraController.tsx");
  test("walk camera responds to movement and look on an upper floor", async () => {
    const building = makeStairProject();
    const poseRef = { current: { x: 2, z: 2, yaw: 0, pitch: 0 } };
    const renderer = await create(
      createElement(WalkCameraController, {
        floor: building.floors[1],
        building,
        elevation: 2.6,
        poseRef,
        movementInputRef: { current: { x: 0, y: -1 } },
        lookInputRef: { current: { x: 0, y: 0 } },
        lookDeltaRef: { current: { x: 40, y: 20 } },
        reducedMotion: true,
        openingPositions: {},
        boundOpeningIds: new Set(),
        onOpeningsChange() {},
        onRoomChange() {},
      }),
    );
    try {
      await renderer.advanceFrames(30, 1 / 60);
      assert.ok(poseRef.current.z < 1.9);
      assert.ok(poseRef.current.yaw < 0);
      const camera = renderer.scene.findByType("PerspectiveCamera").instance;
      assert.ok(camera.position.y > 4);
    } finally {
      await renderer.unmount();
    }
  });
  const { deriveStairFlight } = await load("/packages/engine/src/stairs/flight-geometry.ts");
  for (const ascending of [true, false])
    test(`walk camera stays continuous while ${ascending ? "ascending" : "descending"} floor selection is pending`, async () => {
      const building = makeStairProject();
      const flight = deriveStairFlight(building, building.stairs[0]);
      const startIndex = ascending ? 0 : 1;
      const destinationIndex = ascending ? 1 : 0;
      const poseRef = {
        current: {
          x: flight.startWorld[0],
          z: flight.startWorld[1] + (ascending ? -0.1 : flight.runMeters + 0.1),
          yaw: 0,
          pitch: 0,
        },
      };
      let requestedFloor;
      const props = {
        floor: building.floors[startIndex],
        building,
        elevation: startIndex * 2.6,
        poseRef,
        movementInputRef: { current: { x: 0, y: ascending ? 1 : -1 } },
        lookInputRef: { current: { x: 0, y: 0 } },
        lookDeltaRef: { current: { x: 0, y: 0 } },
        reducedMotion: true,
        openingPositions: {},
        boundOpeningIds: new Set(),
        onOpeningsChange() {},
        onRoomChange() {},
        onFloorChange(id) {
          requestedFloor = id;
        },
      };
      const renderer = await create(createElement(WalkCameraController, props));
      try {
        const camera = renderer.scene.findByType("PerspectiveCamera").instance;
        for (let i = 0; i < 300 && !requestedFloor; i++) await renderer.advanceFrames(1, 1 / 60);
        assert.equal(requestedFloor, building.floors[destinationIndex].id);
        const landingHeight = camera.position.y;
        // Rendering can continue before React commits the floor-picker update.
        for (let i = 0; i < 3; i++) {
          await renderer.advanceFrames(1, 1 / 60);
          assert.ok(
            Math.abs(camera.position.y - landingHeight) < 0.05,
            `camera jumped from ${landingHeight} to ${camera.position.y}`,
          );
        }
        await renderer.update(
          createElement(WalkCameraController, {
            ...props,
            floor: building.floors[destinationIndex],
            elevation: destinationIndex * 2.6,
          }),
        );
        await renderer.advanceFrames(1, 1 / 60);
        assert.ok(Math.abs(camera.position.y - landingHeight) < 0.05);
        // An explicit picker change must still move to its selected floor.
        props.movementInputRef.current = { x: 0, y: 0 };
        await renderer.update(createElement(WalkCameraController, props));
        await renderer.advanceFrames(1, 1 / 60);
        assert.ok(Math.abs(camera.position.y - (startIndex * 2.6 + 1.52)) < 0.05);
      } finally {
        await renderer.unmount();
      }
    });
  const { buildArchitecturalWallGeometries } = await load(
    "/packages/engine/src/architecture-geometry.ts",
  );
  test("upper wall bases meet the lower wall tops without overlapping exterior faces", () => {
    const floor = makeStairProject().floors[1];
    for (const [base, expected] of [
      [undefined, -0.05],
      [0, 0],
    ]) {
      const groups = buildArchitecturalWallGeometries(floor, "#eeeeee", "#aaaaaa", base);
      try {
        const ys = groups.flatMap(({ geometry }) =>
          Array.from(geometry.getAttribute("position").array).filter((_, i) => i % 3 === 1),
        );
        assert.ok(Math.abs(Math.min(...ys) - expected) < 1e-6);
      } finally {
        groups.forEach(({ geometry }) => geometry.dispose());
      }
    }
  });
  test("wall caps are removed only where adjacent levels meet", () => {
    const floors = makeStairProject().floors;
    const countCaps = (groups) =>
      groups.reduce((count, { geometry }) => {
        const positions = geometry.getAttribute("position");
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) {
          const ys = [0, 1, 2].map((offset) => positions.getY(indices[i + offset]));
          if (ys.every((y) => Math.abs(y - ys[0]) < 1e-6)) count++;
        }
        return count;
      }, 0);
    const standalone = buildArchitecturalWallGeometries(floors[1], undefined, undefined, 0);
    const joined = buildArchitecturalWallGeometries(floors[1], undefined, undefined, 0, {
      below: floors[0],
      above: floors[2],
    });
    try {
      assert.ok(countCaps(standalone) > 0);
      assert.equal(countCaps(joined), 0);
    } finally {
      [...standalone, ...joined].forEach(({ geometry }) => geometry.dispose());
    }
  });
  const { ArchitectureScene } = await load("/packages/engine/src/ArchitectureScene.tsx");
  const { composeHomeManifest } = await load("/packages/engine/src/index.ts");
  const { stableArchitectureModelRegistry } = await load(
    "/packages/catalog/src/architecture/index.ts",
  );
  test("roof retains building elevation, hides in cutaway, and remains visible while walking", async () => {
    const manifest = composeHomeManifest(makeStairProject(), {
      furnishingModels: {},
      deviceModels: {},
      openingModels: {},
    });
    const props = {
      manifest,
      floorView: "whole",
      activeFloorId: "first",
      interactionMode: "editor",
      selectedRoomId: null,
      walkMode: false,
      wallFadeEnabled: false,
      reducedMotion: true,
      resolvedBindings: { rooms: {}, openings: {} },
      architectureModels: stableArchitectureModelRegistry,
      deviceModels: {},
      openingPositions: {},
      onInteract() {},
    };
    const renderer = await create(createElement(ArchitectureScene, props));
    try {
      assert.equal(renderer.scene.findAllByProps({ name: "building-roof" }).length, 1);
      assert.equal(
        renderer.scene.findByProps({ name: "architecture-scene" }).instance.position.y,
        0,
      );
      assert.equal(
        renderer.scene.findAll((node) => node.props.name?.startsWith("building-floor-")).length,
        3,
      );
      const roof = renderer.scene.findByProps({ name: "roof-slopes" }).instance;
      roof.geometry.computeBoundingBox();
      assert.ok(roof.geometry.boundingBox.min.y > 5);
      await renderer.update(createElement(ArchitectureScene, { ...props, floorView: "cutaway" }));
      assert.equal(renderer.scene.findAllByProps({ name: "building-roof" }).length, 0);
      await renderer.update(createElement(ArchitectureScene, { ...props, walkMode: true }));
      assert.equal(renderer.scene.findAllByProps({ name: "building-roof" }).length, 1);
    } finally {
      await renderer.unmount();
    }
  });
  test("stairs are drawn above the floor on both connected plan levels", async () => {
    const manifest = composeHomeManifest(makeStairProject(), {
      furnishingModels: {},
      deviceModels: {},
      openingModels: {},
    });
    const props = {
      manifest,
      floorView: "plan",
      interactionMode: "editor",
      selectedRoomId: null,
      walkMode: false,
      wallFadeEnabled: false,
      reducedMotion: true,
      resolvedBindings: { rooms: {}, openings: {} },
      architectureModels: stableArchitectureModelRegistry,
      deviceModels: {},
      openingPositions: {},
      onInteract() {},
    };
    for (const activeFloorId of ["ground", "first", "second"]) {
      const renderer = await create(createElement(ArchitectureScene, { ...props, activeFloorId }));
      try {
        const stairs = renderer.scene.findAllByProps({ name: "stair-plan-ground-stairs" });
        assert.equal(stairs.length, activeFloorId === "second" ? 0 : 1);
        if (stairs.length) assert.ok(stairs[0].instance.position.y > 0.1);
      } finally {
        await renderer.unmount();
      }
    }
  });

  const { ownerHomeProject } = await load("/tests/fixtures/bundled-home.ts");
  const { ownerProjectRegistries } = await load("/apps/web/src/project-runtime.ts");
  const { validateHomeProject } = await load("/packages/engine/src/index.ts");
  const { catalogEntries } = await load("/apps/web/src/editor-preview/furnish/catalog/catalog.ts");
  test("saved lamp furnishings remain loadable without appearing as duplicate catalog choices", async () => {
    const project = structuredClone(ownerHomeProject);
    const legacyIds = ["table-lamp", "woven-pendant", "children-pendant"];
    const originals = new Map(
      project.sceneItems.map((item) => [item.id, JSON.stringify(item.placement)]),
    );
    project.sceneItems = project.sceneItems.map((item) => {
      if (!legacyIds.includes(item.modelId)) return item;
      const { entitySlots, lightState, ...preserved } = item;
      return { ...preserved, kind: "furnishing" };
    });
    const result = validateHomeProject(project, ownerProjectRegistries);
    assert.equal(result.valid, true, JSON.stringify(result.issues));
    for (const item of project.sceneItems)
      assert.equal(JSON.stringify(item.placement), originals.get(item.id));
    const entries = catalogEntries(
      ownerProjectRegistries.furnishingModels,
      ownerProjectRegistries.deviceModels,
    );
    for (const id of legacyIds) {
      assert.ok(ownerProjectRegistries.furnishingModels[id], id);
      assert.ok(!entries.some((entry) => entry.kind === "furnishing" && entry.modelId === id));
      assert.ok(entries.some((entry) => entry.kind === "device" && entry.modelId === id));
    }
  });
});

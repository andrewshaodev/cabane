import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { ConstructionEditLayer } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionEditLayer.tsx",
  );
  const { ConstructionPlanWalls } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionPlanWalls.tsx",
  );
  const { createFloorEditorDraft } = await load("/packages/engine/src/index.ts");
  const { ownerProjectManifest } = await load("/tests/fixtures/bundled-home.ts");
  const base = {
    ...createFloorEditorDraft(ownerProjectManifest.floors[0]),
    coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
    walls: [],
    openings: [],
    rooms: [],
    junctions: [],
  };
  const rayAt = (x, z) => new Raycaster(new Vector3(x, 10, z), new Vector3(0, -1, 0));

  test("plan opening targets win real raycast ordering over walls and selected-wall handles", async () => {
    const draft = {
      ...base,
      walls: [{ id: "wall", from: [0, 0], to: [12, 0], thicknessMeters: 0.4 }],
      openings: ["door", "window", "passage"].map((kind, index) => ({
        id: kind,
        kind,
        wallId: "wall",
        offsetPlanUnits: 1 + index * 4,
        widthPlanUnits: 2,
        openingHeightMeters: 2,
        sillHeightMeters: 0,
      })),
    };
    for (const selection of [null, { kind: "wall", id: "wall" }]) {
      const selected = [];
      const noop = () => {};
      const renderer = await create(
        createElement(ConstructionEditLayer, {
          planMode: true,
          draft,
          coordinates: draft.coordinates,
          rooms: [],
          selection,
          tool: "select",
          onSelectOpening: (id) => selected.push(id),
          onSelectWall: (id) => selected.push(`wall:${id}`),
          onSelectRoom: noop,
          onMoveEndpoint: noop,
          onTranslateWall: noop,
          onMoveOpening: noop,
          onResizeOpening: noop,
          onPlaceOpening: noop,
          onBeginWall: noop,
          onPreviewWall: noop,
          onAddWall: noop,
          onCancelWall: noop,
        }),
      );
      try {
        renderer.scene.instance.updateMatrixWorld(true);
        for (const [index, kind] of ["door", "window", "passage"].entries()) {
          const ray = rayAt(2 + index * 4, 0);
          const targets = renderer.scene.findAll(
            (node) => typeof node.props.onPointerDown === "function",
          );
          const hits = targets
            .flatMap((node) =>
              ray
                .intersectObject(node.instance, false)
                .map((hit) => ({ node, distance: hit.distance })),
            )
            .sort((a, b) => a.distance - b.distance);
          assert.equal(hits[0].node.props.name, `construction-opening-target-${kind}`);
          await renderer.fireEvent(hits[0].node, "pointerDown", {
            pointerId: 1,
            stopPropagation() {},
            target: { setPointerCapture() {} },
            nativeEvent: {},
            ray: ray.ray,
          });
          assert.equal(selected.at(-1), kind);
        }
      } finally {
        await renderer.unmount();
      }
    }
  });

  test("Shift-drag previews and commits a replacement marquee after four CSS pixels", async () => {
    const draft = {
      ...base,
      walls: [
        { id: "north", from: [0, 0], to: [4, 0], thicknessMeters: 0.2 },
        { id: "east", from: [4, 0], to: [4, 3], thicknessMeters: 0.2 },
        { id: "south", from: [4, 3], to: [0, 3], thicknessMeters: 0.2 },
        { id: "west", from: [0, 3], to: [0, 0], thicknessMeters: 0.2 },
      ],
    };
    const rooms = [
      {
        id: "room",
        name: "Room",
        accent: "#c98164",
        polygon: [
          [0, 0],
          [4, 0],
          [4, 3],
          [0, 3],
        ],
      },
    ];
    const selections = [];
    const dragging = [];
    const noop = () => {};
    const keyboard = new EventTarget();
    const eventMethods = ["addEventListener", "removeEventListener"];
    const previousEventMethods = Object.fromEntries(
      eventMethods.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    for (const name of eventMethods)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: keyboard[name].bind(keyboard),
      });
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        planMode: true,
        draft,
        coordinates: draft.coordinates,
        rooms,
        selection: null,
        tool: "select",
        onSelectOpening: noop,
        onSelectWall: noop,
        onSelectRoom: noop,
        onSelectMany: (targets) => selections.push(targets),
        onMoveEndpoint: noop,
        onTranslateWall: noop,
        onMoveOpening: noop,
        onResizeOpening: noop,
        onPlaceOpening: noop,
        onBeginWall: noop,
        onPreviewWall: noop,
        onAddWall: noop,
        onCancelWall: noop,
        onDraggingChange: (active) => dragging.push(active),
      }),
    );
    const capture = {
      active: false,
      setPointerCapture() {
        this.active = true;
      },
      hasPointerCapture() {
        return this.active;
      },
      releasePointerCapture() {
        this.active = false;
      },
    };
    const pointer = (x, z, clientX, clientY, shiftKey = true) => ({
      pointerId: 7,
      button: 0,
      target: capture,
      stopPropagation() {},
      ray: rayAt(x, z).ray,
      nativeEvent: { clientX, clientY, shiftKey, metaKey: false, ctrlKey: false, altKey: false },
    });
    try {
      const surface = renderer.scene.findByProps({ name: "construction-marquee-surface" });
      await renderer.fireEvent(surface, "pointerDown", pointer(-0.1, -0.1, 10, 10));
      await renderer.fireEvent(surface, "pointerMove", pointer(2.1, 1.7, 24, 24));
      assert.ok(renderer.scene.findByProps({ name: "construction-marquee-preview" }));
      await renderer.fireEvent(surface, "pointerUp", pointer(2.1, 1.7, 24, 24));
      assert.deepEqual(dragging, [true, false]);
      assert.ok(selections[0].some((target) => target.kind === "room" && target.id === "room"));
      assert.ok(selections[0].some((target) => target.kind === "wall" && target.id === "north"));
      assert.ok(selections[0].some((target) => target.kind === "wall" && target.id === "west"));

      await renderer.fireEvent(surface, "pointerDown", pointer(0, 0, 30, 30));
      await renderer.fireEvent(surface, "pointerUp", pointer(3, 3, 32, 32));
      assert.equal(selections.length, 1, "sub-threshold Shift gestures do not replace selection");
      await renderer.fireEvent(surface, "pointerDown", pointer(0, 0, 40, 40));
      await renderer.fireEvent(surface, "pointerMove", pointer(3, 3, 54, 54));
      assert.equal(
        renderer.scene.findAllByProps({ name: "construction-marquee-preview" }).length,
        1,
      );
      const escape = new Event("keydown", { cancelable: true });
      Object.defineProperty(escape, "key", { value: "Escape" });
      await act(async () => keyboard.dispatchEvent(escape));
      assert.equal(
        renderer.scene.findAllByProps({ name: "construction-marquee-preview" }).length,
        0,
      );
      assert.equal(
        selections.length,
        1,
        "Escape cancels without replacing the committed selection",
      );
      await renderer.fireEvent(surface, "pointerDown", pointer(0, 0, 40, 40, false));
      assert.equal(
        selections.length,
        1,
        "unmodified primary drags remain available to plan controls",
      );
    } finally {
      await renderer.unmount();
      for (const name of eventMethods) {
        if (previousEventMethods[name])
          Object.defineProperty(globalThis, name, previousEventMethods[name]);
        else delete globalThis[name];
      }
    }
  });

  // Probe rendered triangles, not just a helper's output. Plan visuals intentionally
  // disable picking, so use detached meshes with ordinary raycasting for coverage.
  const covers = (renderer, x, z) => {
    renderer.scene.instance.updateMatrixWorld(true);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    try {
      return renderer.scene
        .findAll((node) => node.instance?.isMesh)
        .some((node) => {
          const probe = new Mesh(node.instance.geometry, material);
          probe.matrixWorld.copy(node.instance.matrixWorld);
          return rayAt(x, z).intersectObject(probe, false).length > 0;
        });
    } finally {
      material.dispose();
    }
  };

  test("plan wall corners fill the outer quadrant without extending free ends or opening gaps", async () => {
    const draft = {
      ...base,
      walls: [
        { id: "horizontal", from: [0, 0], to: [4, 0], thicknessMeters: 0.4 },
        { id: "vertical", from: [0, 0], to: [0, 4], thicknessMeters: 0.6 },
      ],
      openings: [
        {
          id: "gap",
          kind: "passage",
          wallId: "horizontal",
          offsetPlanUnits: 1,
          widthPlanUnits: 1,
          openingHeightMeters: 2,
          sillHeightMeters: 0,
        },
      ],
    };
    const renderer = await create(createElement(ConstructionPlanWalls, { draft }));
    try {
      assert.equal(
        covers(renderer, -0.25, -0.15),
        true,
        "unequal-thickness L join must have no corner notch",
      );
      assert.equal(covers(renderer, -0.35, -0.15), false, "join must not bulge beyond wall faces");
      assert.equal(covers(renderer, 4.05, 0), false, "free ends stay butt capped");
      assert.equal(covers(renderer, 1.5, 0), false, "opening gap stays clear");
    } finally {
      await renderer.unmount();
    }
  });

  test("plan joins follow rotated corners and do not close a corner-adjacent opening", async () => {
    const angle = Math.PI / 5;
    const rotate = ([x, z]) => [
      x * Math.cos(angle) - z * Math.sin(angle),
      x * Math.sin(angle) + z * Math.cos(angle),
    ];
    const walls = [
      { id: "a", from: [0, 0], to: rotate([4, 0]), thicknessMeters: 0.4 },
      { id: "b", from: rotate([0, 4]), to: [0, 0], thicknessMeters: 0.4 },
    ];
    const renderer = await create(
      createElement(ConstructionPlanWalls, { draft: { ...base, walls } }),
    );
    try {
      assert.equal(covers(renderer, ...rotate([-0.15, -0.15])), true);
      await renderer.update(
        createElement(ConstructionPlanWalls, {
          draft: {
            ...base,
            walls,
            openings: [
              {
                id: "gap",
                kind: "passage",
                wallId: "a",
                offsetPlanUnits: 0,
                widthPlanUnits: 1,
                openingHeightMeters: 2,
                sillHeightMeters: 0,
              },
            ],
          },
        }),
      );
      assert.equal(covers(renderer, ...rotate([0.6, 0])), false);
      assert.equal(
        covers(renderer, ...rotate([-0.15, -0.15])),
        false,
        "do not join an arm removed by an opening",
      );
    } finally {
      await renderer.unmount();
    }
  });
});

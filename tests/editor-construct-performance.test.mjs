import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { create } from "@react-three/test-renderer";
import { Ray, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { ConstructionEditLayer } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionEditLayer.tsx",
  );
  const { useConstructEditor } = await load(
    "/apps/web/src/editor-preview/construct/useConstructEditor.ts",
  );
  const { interactionFloor: floor } = await load("/tests/fixtures/interaction-floor.ts");

  test("publishes committed topology immediately without waiting for 3D mesh construction", async (context) => {
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const dom = new JSDOM("<!doctype html><div id='root'></div>");
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    let editor;

    function Harness() {
      editor = useConstructEditor(floor);
      return null;
    }

    const root = createRoot(dom.window.document.querySelector("#root"));
    try {
      await act(async () => root.render(createElement(Harness)));
      assert.equal(editor.isSettling, false);
      const opening = editor.draft.openings[0];
      const previousOffset = editor.previewFloor.openings.find(
        (candidate) => candidate.id === opening.id,
      ).offsetFromWallStartPlanUnits;

      act(() =>
        editor.dispatch({
          type: "move-opening",
          openingId: opening.id,
          wallId: opening.wallId,
          offsetPlanUnits: previousOffset + 0.1,
        }),
      );

      assert.equal(editor.draft.openings[0].offsetPlanUnits, previousOffset + 0.1);
      assert.equal(editor.isSettling, false, "The synchronous topology is ready for Home/Apply");
      assert.equal(
        editor.previewFloor.openings.find((candidate) => candidate.id === opening.id)
          .offsetFromWallStartPlanUnits,
        previousOffset + 0.1,
        "Home, Preview, and Apply can use the release without an architecture timer",
      );
      assert.equal(editor.history.past.length, 1, "one release creates one undo step");

      await act(async () => {
        context.mock.timers.runAll();
      });
      assert.equal(
        editor.previewFloor.openings.find((candidate) => candidate.id === opening.id)
          .offsetFromWallStartPlanUnits,
        previousOffset + 0.1,
      );
      assert.equal(editor.isSettling, false);
      assert.equal(
        editor.topologyIssues.length,
        0,
        "accepted baseline diagnostics stay hidden after an unrelated valid edit",
      );

      act(() => editor.selectWall("fixture-north"));
      act(() => editor.updateSelectedWallMetadata({ thicknessMeters: 0.26 }));
      await act(async () => {
        context.mock.timers.runAll();
      });
      assert.equal(
        editor.topologyIssues.length,
        0,
        "changing wall metadata must not reveal accepted baseline diagnostics",
      );
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    }
  });

  test("republishes the original architecture after undoing back to the initial draft", async (context) => {
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const dom = new JSDOM("<!doctype html><div id='root'></div>");
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    let editor;

    function Harness() {
      editor = useConstructEditor(floor);
      return null;
    }

    const root = createRoot(dom.window.document.querySelector("#root"));
    try {
      await act(async () => root.render(createElement(Harness)));
      const opening = editor.draft.openings[0];
      const initialOffset = opening.offsetPlanUnits;

      act(() =>
        editor.dispatch({
          type: "move-opening",
          openingId: opening.id,
          wallId: opening.wallId,
          offsetPlanUnits: initialOffset + 0.1,
        }),
      );
      await act(async () => {
        context.mock.timers.runAll();
      });
      assert.equal(
        editor.previewFloor.openings.find((candidate) => candidate.id === opening.id)
          .offsetFromWallStartPlanUnits,
        initialOffset + 0.1,
      );

      act(() => editor.undo());
      assert.equal(editor.draft.openings[0].offsetPlanUnits, initialOffset);
      assert.equal(editor.isSettling, false);
      await act(async () => {
        context.mock.timers.runAll();
      });
      assert.equal(
        editor.previewFloor.openings.find((candidate) => candidate.id === opening.id)
          .offsetFromWallStartPlanUnits,
        initialOffset,
      );
      assert.equal(editor.isSettling, false);
      // A shared workspace history restore supersedes a pending geometry edit.
      act(() =>
        editor.dispatch({
          type: "move-opening",
          openingId: opening.id,
          wallId: opening.wallId,
          offsetPlanUnits: initialOffset + 0.2,
        }),
      );
      act(() => editor.replaceFloor(floor));
      assert.equal(editor.isSettling, false);
      await act(async () => {
        context.mock.timers.runAll();
      });
      assert.equal(
        editor.previewFloor.openings.find((candidate) => candidate.id === opening.id)
          .offsetFromWallStartPlanUnits,
        initialOffset,
      );
      assert.equal(editor.isSettling, false);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    }
  });

  test("continues a connected wall chain until it is explicitly cancelled", async () => {
    const dom = new JSDOM("<!doctype html><div id='root'></div>");
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    let editor;

    function Harness() {
      editor = useConstructEditor(floor);
      return null;
    }

    const root = createRoot(dom.window.document.querySelector("#root"));
    try {
      await act(async () => root.render(createElement(Harness)));
      const initialWallCount = editor.draft.walls.length;
      act(() => editor.setTool("wall"));
      act(() => editor.beginWall([20, 0]));
      act(() => editor.addWall([21, 0]));
      assert.equal(editor.draft.walls.length, initialWallCount + 1);
      assert.deepEqual(editor.drawStart, [21, 0]);

      act(() => editor.addWall([21, 1]));
      assert.equal(editor.draft.walls.length, initialWallCount + 2);
      assert.deepEqual(editor.drawStart, [21, 1]);
      assert.equal(editor.history.past.length, 2);

      act(() => editor.cancelWall());
      assert.equal(editor.drawStart, null);
      assert.equal(editor.drawPreview, null);
      assert.equal(editor.history.past.length, 2, "cancelling the chain adds no history entry");
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    }
  });

  test("returns to Select when a connected wall chain closes a region", async () => {
    const dom = new JSDOM("<!doctype html><div id='root'></div>");
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    let editor;

    function Harness() {
      editor = useConstructEditor(floor);
      return null;
    }

    const root = createRoot(dom.window.document.querySelector("#root"));
    try {
      await act(async () => root.render(createElement(Harness)));
      const initialWallCount = editor.draft.walls.length;
      act(() => editor.setTool("wall"));
      act(() => editor.beginWall([20, 0]));
      act(() => editor.addWall([21, 0]));
      act(() => editor.addWall([21, 1]));
      act(() => editor.addWall([20, 1]));
      assert.deepEqual(editor.drawStart, [20, 1]);

      act(() => editor.addWall([20, 0]));

      assert.equal(editor.draft.walls.length, initialWallCount + 4);
      assert.equal(editor.drawStart, null);
      assert.equal(editor.drawPreview, null);
      assert.equal(
        editor.selection,
        null,
        "the closing wall does not leave an orange selection behind",
      );
      assert.equal(editor.tool, "select", "closing a room returns to the default Select tool");
      assert.equal(editor.history.past.length, 4);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    }
  });

  test("returns to Select when a wall chain closes onto an existing wall", async () => {
    const dom = new JSDOM("<!doctype html><div id='root'></div>");
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    let editor;

    function Harness() {
      editor = useConstructEditor(floor);
      return null;
    }

    const root = createRoot(dom.window.document.querySelector("#root"));
    try {
      await act(async () => root.render(createElement(Harness)));
      const initialWallCount = editor.draft.walls.length;
      const support = editor.draft.walls[0];
      const along = [support.to[0] - support.from[0], support.to[1] - support.from[1]];
      const length = Math.hypot(...along);
      const normal = [-along[1] / length, along[0] / length];
      const pointAt = (progress) => [
        support.from[0] + along[0] * progress,
        support.from[1] + along[1] * progress,
      ];
      const start = pointAt(0.25);
      const end = pointAt(0.75);
      const offset = (point) => [point[0] + normal[0], point[1] + normal[1]];

      act(() => editor.setTool("wall"));
      act(() => editor.beginWall(start));
      act(() => editor.addWall(offset(start)));
      act(() => editor.addWall(offset(end)));
      assert.deepEqual(editor.drawStart, offset(end));

      act(() => editor.addWall(end));

      assert.equal(editor.draft.walls.length, initialWallCount + 3);
      assert.equal(editor.drawStart, null);
      assert.equal(editor.drawPreview, null);
      assert.equal(
        editor.selection,
        null,
        "closing on an existing wall also clears the wall selection",
      );
      assert.equal(
        editor.tool,
        "select",
        "closing three new walls against an existing wall returns to Select",
      );
      assert.equal(editor.history.past.length, 3);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    }
  });

  test("coalesces an opening drag into one architectural edit on pointer up", async () => {
    const opening = floor.openings.find((candidate) => candidate.id === "fixture-door");
    const draftOpening = {
      id: opening.id,
      wallId: opening.wallId,
      kind: opening.kind,
      offsetPlanUnits: opening.offsetFromWallStartPlanUnits,
      widthPlanUnits: opening.widthPlanUnits,
      openingHeightMeters: opening.openingHeightMeters,
      sillHeightMeters: opening.sillHeightMeters,
      operation: opening.operation,
      variant: opening.variant,
      finish: opening.finish,
      leafCount: opening.leafCount,
    };
    const moves = [];
    const resizes = [];
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        draft: {
          version: 1,
          floorId: floor.id,
          floorName: floor.name,
          walls: floor.walls.map((wall) => ({ id: wall.id, from: wall.from, to: wall.to })),
          openings: [draftOpening],
          rooms: [],
          junctions: [],
          defaultWallHeightMeters: floor.defaultWallHeightMeters,
          defaultCeilingHeightMeters: floor.defaultCeilingHeightMeters,
          exteriorWallThicknessMeters: 0.2,
          interiorWallThicknessMeters: 0.12,
          tool: "select",
          selection: { kind: "opening", id: opening.id },
          view: { center: [0, 0], pixelsPerMeter: 82 },
          nextSerial: 1,
        },
        coordinates: floor.coordinates,
        rooms: [],
        selection: { kind: "opening", id: opening.id },
        tool: "select",
        onSelectWall() {},
        onSelectOpening() {},
        onSelectRoom() {},
        onMoveEndpoint() {},
        onTranslateWall() {},
        onMoveOpening: (...args) => moves.push(args),
        onResizeOpening: (...args) => resizes.push(args),
        onPlaceOpening() {},
        onBeginWall() {},
        onPreviewWall() {},
        onAddWall() {},
        onCancelWall() {},
      }),
    );
    const pointerTarget = {
      setPointerCapture() {},
      hasPointerCapture() {
        return true;
      },
      releasePointerCapture() {},
    };
    const pointerAt = (planX, planZ = 0.16, altKey = false) => ({
      pointerId: 7,
      target: pointerTarget,
      stopPropagation() {},
      nativeEvent: { altKey, pointerType: "mouse", clientX: planX * 100, clientY: planZ * 100 },
      ray: new Ray(
        new Vector3(
          (planX - floor.coordinates.origin[0]) * floor.coordinates.metersPerPlanUnit,
          1,
          (planZ - floor.coordinates.origin[1]) * floor.coordinates.metersPerPlanUnit,
        ),
        new Vector3(0, -1, 0),
      ),
    });

    try {
      assert.ok(
        renderer.scene.findByProps({
          name: `construction-opening-clearances-${opening.id}`,
        }),
      );
      assert.ok(
        renderer.scene.findByProps({
          name: `construction-opening-resize-${opening.id}-start`,
        }),
      );
      let target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      await renderer.fireEvent(target, "pointerDown", pointerAt(6));
      await renderer.fireEvent(target, "pointerMove", pointerAt(6.04));
      await renderer.fireEvent(target, "pointerUp", pointerAt(6.04));
      assert.equal(moves.length, 0, "sub-threshold pointer wobble only selects the opening");
      target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      await renderer.fireEvent(target, "pointerDown", pointerAt(6));
      for (let index = 0; index < 40; index += 1) {
        target = renderer.scene.findByProps({
          name: `construction-opening-target-${opening.id}`,
        });
        await renderer.fireEvent(target, "pointerMove", pointerAt(6 + index * 0.01));
      }
      assert.equal(moves.length, 0, "pointer moves only update the lightweight overlay");
      target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      await renderer.fireEvent(target, "pointerUp", pointerAt(6.4));
      assert.equal(moves.length, 1, "the architectural model updates once on release");

      target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      await renderer.fireEvent(target, "pointerDown", pointerAt(6.4));
      target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      await renderer.fireEvent(target, "pointerMove", pointerAt(11.3, 1));
      assert.equal(moves.length, 1, "wall transfer remains a transient preview");
      target = renderer.scene.findByProps({
        name: `construction-opening-target-${opening.id}`,
      });
      assert.equal(target.props.userData.wallId, "fixture-east");
      assert.equal(target.props.userData.validPlacement, true);
      await renderer.fireEvent(target, "pointerUp", pointerAt(11.3, 1));
      assert.equal(moves.length, 2);
      assert.equal(moves[1][1], "fixture-east");

      let resize = renderer.scene.findByProps({
        name: `construction-opening-resize-${opening.id}-end`,
      });
      await renderer.fireEvent(resize, "pointerDown", pointerAt(6.17));
      resize = renderer.scene.findByProps({
        name: `construction-opening-resize-${opening.id}-end`,
      });
      await renderer.fireEvent(resize, "pointerMove", pointerAt(7));
      assert.equal(resizes.length, 0, "resize previews do not publish architecture");
      resize = renderer.scene.findByProps({
        name: `construction-opening-resize-${opening.id}-end`,
      });
      await renderer.fireEvent(resize, "pointerUp", pointerAt(7));
      assert.equal(resizes.length, 1);
      assert.ok(resizes[0][1] > opening.widthPlanUnits);
    } finally {
      await renderer.unmount();
    }
  });

  test("previews direct opening placement and commits only clear wall spans", async () => {
    const opening = floor.openings.find((candidate) => candidate.id === "fixture-door");
    const placements = [];
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        draft: {
          version: 1,
          coordinates: floor.coordinates,
          floorId: floor.id,
          floorName: floor.name,
          walls: floor.walls.map((wall) => ({ id: wall.id, from: wall.from, to: wall.to })),
          openings: [
            {
              id: opening.id,
              wallId: opening.wallId,
              kind: opening.kind,
              offsetPlanUnits: opening.offsetFromWallStartPlanUnits,
              widthPlanUnits: opening.widthPlanUnits,
              openingHeightMeters: opening.openingHeightMeters,
              sillHeightMeters: opening.sillHeightMeters,
              operation: opening.operation,
              variant: opening.variant,
              finish: opening.finish,
              leafCount: opening.leafCount,
            },
          ],
          rooms: [],
          junctions: [],
          defaultWallHeightMeters: floor.defaultWallHeightMeters,
          defaultCeilingHeightMeters: floor.defaultCeilingHeightMeters,
          exteriorWallThicknessMeters: 0.2,
          interiorWallThicknessMeters: 0.12,
          tool: "door",
          selection: null,
          view: { center: [0, 0], pixelsPerMeter: 82 },
          nextSerial: 1,
        },
        coordinates: floor.coordinates,
        rooms: [],
        selection: null,
        tool: "door",
        onSelectWall() {},
        onSelectOpening() {},
        onSelectRoom() {},
        onMoveEndpoint() {},
        onTranslateWall() {},
        onMoveOpening() {},
        onResizeOpening() {},
        onPlaceOpening: (...args) => placements.push(args),
        onBeginWall() {},
        onPreviewWall() {},
        onAddWall() {},
        onCancelWall() {},
      }),
    );
    const pointerAt = (planX) => ({
      pointerId: 11,
      target: {},
      stopPropagation() {},
      nativeEvent: { altKey: false, pointerType: "mouse", clientX: planX * 100, clientY: 16 },
      ray: new Ray(
        new Vector3(
          (planX - floor.coordinates.origin[0]) * floor.coordinates.metersPerPlanUnit,
          1,
          (0.16 - floor.coordinates.origin[1]) * floor.coordinates.metersPerPlanUnit,
        ),
        new Vector3(0, -1, 0),
      ),
    });

    try {
      const surface = renderer.scene.findByProps({ name: "construction-placement-surface" });
      await renderer.fireEvent(surface, "pointerMove", pointerAt(2));
      let preview = renderer.scene.findByProps({
        name: "construction-opening-placement-preview-door",
      });
      assert.equal(preview.props.userData.validPlacement, true);
      assert.equal(preview.props.userData.wallId, "fixture-north");
      await renderer.fireEvent(surface, "pointerDown", pointerAt(2));
      assert.equal(placements.length, 1);
      assert.equal(placements[0][0], "door");

      await renderer.fireEvent(surface, "pointerMove", pointerAt(5.5));
      preview = renderer.scene.findByProps({ name: "construction-opening-placement-preview-door" });
      assert.equal(preview.props.userData.validPlacement, false);
      await renderer.fireEvent(surface, "pointerDown", pointerAt(5.5));
      assert.equal(placements.length, 1, "colliding previews never commit");
      await renderer.fireEvent(surface, "pointerMove", pointerAt(0.45));
      preview = renderer.scene.findByProps({ name: "construction-opening-placement-preview-door" });
      assert.equal(
        preview.props.userData.validPlacement,
        false,
        "corner clearance is shown in the preview",
      );
      await renderer.fireEvent(surface, "pointerDown", pointerAt(0.45));
      assert.equal(placements.length, 1, "junction collisions never commit");
    } finally {
      await renderer.unmount();
    }
  });

  test("selects resolved rooms through the lightweight 3d floor overlay", async () => {
    const selections = [];
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        draft: {
          version: 1,
          floorId: floor.id,
          floorName: floor.name,
          walls: floor.walls.map((wall) => ({ id: wall.id, from: wall.from, to: wall.to })),
          openings: [],
          rooms: [],
          junctions: [],
          defaultWallHeightMeters: floor.defaultWallHeightMeters,
          defaultCeilingHeightMeters: floor.defaultCeilingHeightMeters,
          exteriorWallThicknessMeters: 0.2,
          interiorWallThicknessMeters: 0.12,
          tool: "select",
          selection: null,
          view: { center: [0, 0], pixelsPerMeter: 82 },
          nextSerial: 1,
        },
        coordinates: floor.coordinates,
        rooms: floor.rooms,
        selection: null,
        tool: "select",
        onSelectWall() {},
        onSelectOpening() {},
        onSelectRoom: (id) => selections.push(id),
        onMoveEndpoint() {},
        onTranslateWall() {},
        onMoveOpening() {},
        onResizeOpening() {},
        onPlaceOpening() {},
        onBeginWall() {},
        onPreviewWall() {},
        onAddWall() {},
        onCancelWall() {},
      }),
    );
    try {
      const room = floor.rooms[0];
      const target = renderer.scene.findByProps({ name: `construction-room-target-${room.id}` });
      assert.equal(target.props.userData.roomId, room.id);
      await renderer.fireEvent(target, "pointerDown", { stopPropagation() {} });
      assert.deepEqual(selections, [room.id]);
    } finally {
      await renderer.unmount();
    }
  });

  test("previews both branches while dragging a shared right-angle corner", async () => {
    const moves = [];
    const walls = [
      { id: "horizontal", from: [0, 0], to: [2, 0] },
      { id: "vertical", from: [2, 0], to: [2, 2] },
      { id: "snap-target", from: [3, 1], to: [4, 1] },
    ];
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        draft: {
          version: 1,
          floorId: "corner-floor",
          floorName: "Corner floor",
          walls,
          openings: [],
          rooms: [],
          junctions: [],
          defaultWallHeightMeters: 2.5,
          defaultCeilingHeightMeters: 2.5,
          exteriorWallThicknessMeters: 0.2,
          interiorWallThicknessMeters: 0.12,
          tool: "select",
          selection: { kind: "wall", id: "horizontal" },
          view: { center: [1, 1], pixelsPerMeter: 82 },
          nextSerial: 1,
        },
        coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
        rooms: [],
        selection: { kind: "wall", id: "horizontal" },
        tool: "select",
        onSelectWall() {},
        onSelectOpening() {},
        onSelectRoom() {},
        onMoveEndpoint: (...args) => moves.push(args),
        onTranslateWall() {},
        onMoveOpening() {},
        onResizeOpening() {},
        onPlaceOpening() {},
        onBeginWall() {},
        onPreviewWall() {},
        onAddWall() {},
        onCancelWall() {},
      }),
    );
    const pointerTarget = {
      setPointerCapture() {},
      hasPointerCapture() {
        return true;
      },
      releasePointerCapture() {},
    };
    const pointerAtGround = (x, z) => ({
      pointerId: 9,
      target: pointerTarget,
      stopPropagation() {},
      nativeEvent: { altKey: false, pointerType: "mouse", clientX: x * 100, clientY: z * 100 },
      ray: new Ray(new Vector3(x, 1, z), new Vector3(0, -1, 0)),
    });

    try {
      let endpoint = renderer.scene.findByProps({
        name: "construction-wall-endpoint-horizontal-to",
      });
      await renderer.fireEvent(endpoint, "pointerDown", pointerAtGround(2, 0));
      endpoint = renderer.scene.findByProps({
        name: "construction-wall-endpoint-horizontal-to",
      });
      await renderer.fireEvent(endpoint, "pointerMove", pointerAtGround(2.9, 1.05));

      assert.deepEqual(
        renderer.scene.findByProps({ name: "construction-wall-target-horizontal" }).props.position,
        [1.5, 0.1, 0.5],
      );
      assert.deepEqual(
        renderer.scene.findByProps({ name: "construction-wall-target-vertical" }).props.position,
        [2.5, 0.1, 1.5],
        "both right-angle branches must follow the exact snapped endpoint",
      );
      assert.equal(moves.length, 0, "the shared-corner preview stays off the architectural model");

      endpoint = renderer.scene.findByProps({
        name: "construction-wall-endpoint-horizontal-to",
      });
      await renderer.fireEvent(endpoint, "pointerUp", pointerAtGround(2.9, 1.05));
      assert.deepEqual(moves, [["horizontal", "to", [3, 1]]]);
    } finally {
      await renderer.unmount();
    }
  });

  test("previews whole-wall translation with both connected corners and commits once", async () => {
    const translations = [];
    const walls = [
      { id: "horizontal", from: [0, 0], to: [2, 0] },
      { id: "left", from: [0, 0], to: [0, 2] },
      { id: "right", from: [2, 0], to: [2, 2] },
    ];
    const renderer = await create(
      createElement(ConstructionEditLayer, {
        draft: {
          version: 1,
          floorId: "translated-corners",
          floorName: "Translated corners",
          walls,
          openings: [],
          rooms: [],
          junctions: [],
          defaultWallHeightMeters: 2.5,
          defaultCeilingHeightMeters: 2.5,
          exteriorWallThicknessMeters: 0.2,
          interiorWallThicknessMeters: 0.12,
          tool: "select",
          selection: { kind: "wall", id: "horizontal" },
          view: { center: [1, 1], pixelsPerMeter: 82 },
          nextSerial: 1,
        },
        coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
        rooms: [],
        selection: { kind: "wall", id: "horizontal" },
        tool: "select",
        onSelectWall() {},
        onSelectOpening() {},
        onSelectRoom() {},
        onMoveEndpoint() {},
        onTranslateWall: (...args) => translations.push(args),
        onMoveOpening() {},
        onResizeOpening() {},
        onPlaceOpening() {},
        onBeginWall() {},
        onPreviewWall() {},
        onAddWall() {},
        onCancelWall() {},
      }),
    );
    const pointerTarget = {
      setPointerCapture() {},
      hasPointerCapture() {
        return true;
      },
      releasePointerCapture() {},
    };
    const pointerAtGround = (x, z) => ({
      pointerId: 10,
      target: pointerTarget,
      stopPropagation() {},
      nativeEvent: { altKey: false, pointerType: "mouse", clientX: x * 100, clientY: z * 100 },
      ray: new Ray(new Vector3(x, 1, z), new Vector3(0, -1, 0)),
    });

    try {
      const measurement = renderer.scene.findByProps({
        name: "construction-wall-measurement-horizontal",
      });
      assert.equal(measurement.props.userData.label, "2.00 m");
      assert.equal(measurement.props.userData.directionDegrees, 0);

      let center = renderer.scene.findByProps({ name: "construction-wall-center-horizontal" });
      await renderer.fireEvent(center, "pointerDown", pointerAtGround(1, 0));
      await renderer.fireEvent(center, "pointerMove", pointerAtGround(1.04, 0));
      await renderer.fireEvent(center, "pointerUp", pointerAtGround(1.04, 0));
      assert.equal(translations.length, 0, "sub-threshold pointer wobble does not move the wall");
      center = renderer.scene.findByProps({ name: "construction-wall-center-horizontal" });
      await renderer.fireEvent(center, "pointerDown", pointerAtGround(1, 0));
      center = renderer.scene.findByProps({ name: "construction-wall-center-horizontal" });
      await renderer.fireEvent(center, "pointerMove", pointerAtGround(1, 0.5));

      assert.deepEqual(
        renderer.scene.findByProps({ name: "construction-wall-target-horizontal" }).props.position,
        [1, 0.1, 0.5],
      );
      assert.deepEqual(
        renderer.scene.findByProps({ name: "construction-wall-target-left" }).props.position,
        [0, 0.1, 1.25],
      );
      assert.deepEqual(
        renderer.scene.findByProps({ name: "construction-wall-target-right" }).props.position,
        [2, 0.1, 1.25],
      );
      assert.equal(translations.length, 0);

      center = renderer.scene.findByProps({ name: "construction-wall-center-horizontal" });
      await renderer.fireEvent(center, "pointerUp", pointerAtGround(1, 0.5));
      assert.deepEqual(translations, [["horizontal", [0, 0.5]]]);
    } finally {
      await renderer.unmount();
    }
  });
});

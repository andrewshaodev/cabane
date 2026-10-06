import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { OrthographicCamera, Ray, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { useConstructEditor } = await load(
    "/apps/web/src/editor-preview/construct/useConstructEditor.ts",
  );
  const { ConstructionEditLayer } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionEditLayer.tsx",
  );
  const { ConstructionHedgeLayer } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionHedgeLayer.tsx",
  );
  const { useConstructionOutlineDrag } = await load(
    "/apps/web/src/editor-preview/construct/useConstructionOutlineDrag.ts",
  );
  const { ArchitecturalHedges } = await load("/packages/engine/src/hedges/index.ts");
  const { exportFloorSpec, importFloorSpec } = await load(
    "/packages/engine/src/home-project/legacy-floor-storage.ts",
  );
  const { layoutFloorFromEditorFloor } = await load("/apps/web/src/editor-preview/project-sync.ts");
  const base = engine.neutralDemoManifest.floors[0];
  const pointer = (x, z) => ({
    pointerId: 1,
    button: 0,
    target: {
      setPointerCapture() {},
      hasPointerCapture() {
        return true;
      },
      releasePointerCapture() {},
    },
    stopPropagation() {},
    nativeEvent: { altKey: true, pointerType: "mouse", clientX: x * 100, clientY: z * 100 },
    ray: new Ray(new Vector3(x, 10, z), new Vector3(0, -1, 0)),
  });
  test("Hedge uses segment pointer gestures and preserves architecture through edit, deletion and history", async () => {
    let editor;
    function Harness() {
      editor = useConstructEditor(base);
      return createElement(
        "group",
        {},
        createElement(ConstructionEditLayer, {
          planMode: true,
          draft: editor.draft,
          coordinates: editor.draft.coordinates,
          rooms: editor.previewFloor.rooms,
          selection: editor.selection,
          tool: editor.tool,
          drawStart: editor.drawStart,
          drawPreview: editor.drawPreview,
          onBeginWall: editor.beginWall,
          onPreviewWall: editor.previewWall,
          onAddWall: editor.addWall,
          onCancelWall: editor.cancelWall,
          onSelectWall() {},
          onSelectOpening() {},
          onSelectRoom() {},
          onMoveEndpoint() {},
          onTranslateWall() {},
          onMoveOpening() {},
          onResizeOpening() {},
          onPlaceOpening() {},
        }),
        createElement(ConstructionHedgeLayer, { editor, onDraggingChange() {} }),
      );
    }
    const camera = new OrthographicCamera(-500, 500, 400, -400, 0.1, 100);
    camera.zoom = 100;
    camera.updateProjectionMatrix();
    const renderer = await create(createElement(Harness), { camera, width: 1000, height: 800 });
    try {
      act(() => editor.setTool("hedge"));
      const surface = () => renderer.scene.findByProps({ name: "construction-placement-surface" });
      await renderer.fireEvent(surface(), "pointerDown", pointer(10, 0));
      await renderer.fireEvent(surface(), "pointerMove", pointer(14, 0));
      await renderer.fireEvent(surface(), "pointerUp", pointer(14, 0));
      assert.equal(editor.previewFloor.hedges.length, 1);
      assert.equal(editor.previewFloor.walls, base.walls);
      assert.equal(editor.previewFloor.rooms, base.rooms);
      const id = editor.previewFloor.hedges[0].id;
      act(() => editor.setTool("select"));
      const hit = () => renderer.scene.findByProps({ name: `construction-hedge-${id}` });
      await renderer.fireEvent(hit(), "pointerDown", pointer(12, 0));
      await renderer.fireEvent(hit(), "pointerMove", pointer(12, 2));
      await renderer.fireEvent(hit(), "pointerUp", pointer(12, 2));
      const hedge = editor.previewFloor.hedges[0];
      const [x, z] = engine.planPointToWorld(hedge.from, base.coordinates);
      assert.deepEqual([x, z], [10, 2]);
      const endpoint = () =>
        renderer.scene.findByProps({ name: `construction-hedge-endpoint-${id}-1` });
      await renderer.fireEvent(endpoint(), "pointerDown", pointer(14, 2));
      await renderer.fireEvent(endpoint(), "pointerMove", pointer(15, 3));
      await renderer.fireEvent(endpoint(), "pointerUp", pointer(15, 3));
      assert.deepEqual(
        engine.planPointToWorld(editor.previewFloor.hedges[0].to, base.coordinates),
        [15, 3],
      );
      act(() =>
        editor.dispatch({ type: "update-hedge", id, changes: { style: "bushy", heightMeters: 2 } }),
      );
      assert.equal(editor.previewFloor.hedges[0].style, "bushy");
      const restored = importFloorSpec(exportFloorSpec(editor.previewFloor));
      assert.equal(restored.valid, true, JSON.stringify(restored.issues));
      assert.deepEqual(restored.floor.hedges, editor.previewFloor.hedges);
      act(() => editor.deleteSelected());
      assert.equal(editor.previewFloor.hedges.length, 0);
      act(() => editor.undo());
      assert.equal(editor.previewFloor.hedges.length, 1);
      act(() => editor.redo());
      assert.equal(editor.previewFloor.hedges.length, 0);
    } finally {
      await renderer.unmount();
    }
  });

  test("strict project schema preserves hedges and rejects invalid dimensions or unknown fields", async () => {
    const floor = {
      ...base,
      hedges: [
        {
          id: "schema-hedge",
          from: [10, 0],
          to: [14, 0],
          style: "rounded",
          heightMeters: 1.4,
          widthMeters: 0.7,
        },
      ],
    };
    const project = {
      schemaVersion: 1,
      seedRevision: "hedge-test",
      home: engine.neutralDemoManifest.home,
      floor: layoutFloorFromEditorFloor(floor),
      sceneItems: [],
      roomProfiles: {},
      openingProfiles: {},
      shortcuts: [],
      assumptions: [],
    };
    assert.equal(
      engine.validateHomeProject(project, { furnishingModels: {}, deviceModels: {} }).valid,
      true,
    );
    const invalid = structuredClone(project);
    invalid.floor.hedges[0].widthMeters = -1;
    assert.equal(engine.parseHomeProjectSchema(invalid).valid, false);
    const unknown = structuredClone(project);
    unknown.floor.hedges[0].texture = "external";
    assert.equal(engine.parseHomeProjectSchema(unknown).valid, false);
  });
  test("all hedge models render toon geometry and derive a matching walk obstacle", async () => {
    for (const style of ["clipped", "rounded", "bushy", "mixed", "ivy-wall"]) {
      const floor = {
        ...base,
        hedges: [
          { id: "hedge", from: [10, 0], to: [14, 0], style, heightMeters: 1.4, widthMeters: 0.7 },
        ],
      };
      const renderer = await create(createElement(ArchitecturalHedges, { floor }));
      try {
        assert.ok(renderer.scene.findAll((node) => node.type === "Mesh").length > 0);
        const collider = engine
          .deriveWalkColliders(floor)
          .find((entry) => entry.id === "hedge-walk");
        assert.equal(collider.halfThickness, 0.35);
      } finally {
        await renderer.unmount();
      }
      assert.equal(engine.validateLayoutFloorSpec(floor).valid, true);
    }
    const floor = {
      ...base,
      hedges: [
        { id: "bad", from: [1, 1], to: [1, 1], style: "unknown", heightMeters: 0, widthMeters: -1 },
      ],
    };
    assert.equal(engine.validateLayoutFloorSpec(floor).valid, false);
  });
  test("hedge, pool, and floor corner drags use neighboring angles and clear alignment on Alt", async () => {
    const angle = 0.3;
    const at = (x, y) => [
      10 + x * Math.cos(angle) - y * Math.sin(angle),
      10 + x * Math.sin(angle) + y * Math.cos(angle),
    ];
    const original = [at(0, 0), at(4, 0), at(4, 2.9), at(0, 3)];
    for (const selectionKind of ["hedge", "pool", "floor-zone"]) {
      let controller;
      const commits = [];
      const draft = {
        ...engine.createFloorEditorDraft(base),
        coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
        walls: [],
        hedges:
          selectionKind === "hedge"
            ? original.map((from, i) => ({
                id: i === 1 ? "shape" : `edge-${i}`,
                from,
                to: original[(i + 1) % original.length],
                style: "clipped",
                heightMeters: 1.4,
                widthMeters: 0.65,
              }))
            : [],
      };
      const outline = selectionKind === "hedge" ? [original[1], original[2]] : original;
      const corner = selectionKind === "hedge" ? 1 : 2;
      const selection = { kind: selectionKind, id: "shape" };
      function Harness() {
        controller = useConstructionOutlineDrag({
          draft,
          selection,
          tool: "select",
          selectionKind,
          onSelect() {},
          onUpdate: (_id, points) => commits.push(points),
        });
        return createElement("mesh", {
          name: "corner",
          ...controller.handlers("shape", outline, corner),
        });
      }
      const camera = new OrthographicCamera(-500, 500, 400, -400, 0.1, 100);
      camera.zoom = 100;
      camera.updateProjectionMatrix();
      const renderer = await create(createElement(Harness), { camera, width: 1000, height: 800 });
      const event = (point, altKey = false) => {
        const result = pointer(...point);
        result.nativeEvent.altKey = altKey;
        return result;
      };
      try {
        const mesh = () => renderer.scene.findByProps({ name: "corner" });
        await renderer.fireEvent(mesh(), "pointerDown", event(original[2]));
        await renderer.fireEvent(mesh(), "pointerMove", event(at(4.04, 3.05)));
        controller.drag.polygon[corner].forEach((value, i) =>
          assert.ok(
            Math.abs(value - at(4, 3)[i]) < 1e-9,
            `${selectionKind}: ${controller.drag.polygon[corner]} expected ${at(4, 3)}`,
          ),
        );
        assert.equal(controller.snap.kind, "alignment");
        assert.equal(commits.length, 0);
        await renderer.fireEvent(mesh(), "pointerMove", event(at(4.04, 3.05), true));
        assert.equal(controller.snap, null);
        await renderer.fireEvent(mesh(), "pointerMove", event(at(4.04, 3.05)));
        const preview = controller.drag.polygon;
        await renderer.fireEvent(mesh(), "pointerUp", event(at(4.04, 3.05)));
        assert.deepEqual(commits, [preview]);
        assert.equal(controller.snap, null);
      } finally {
        await renderer.unmount();
      }
    }
  });
});

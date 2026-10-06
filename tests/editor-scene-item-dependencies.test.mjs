import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { useConstructEditor } = await load(
    "/apps/web/src/editor-preview/construct/useConstructEditor.ts",
  );
  const { useFurnishingEditor } = await load(
    "/apps/web/src/editor-preview/furnish/useFurnishingEditor.ts",
  );
  const { useSceneItemDependencies } = await load(
    "/apps/web/src/editor-preview/construct/useSceneItemDependencies.ts",
  );
  const { projectFromEditorState } = await load("/apps/web/src/editor-preview/project-sync.ts");
  const { resolveItemTransform } = await load("/packages/engine/src/index.ts");
  const { ownerHomeProject, ownerProjectManifest } = await load("/tests/fixtures/bundled-home.ts");

  test("wall deletion cleans Arrange state before moving, cancelling, duplicating, or restoring history", async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>');
    const names = ["window", "document", "navigator"];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    for (const name of names)
      Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    const root = createRoot(dom.window.document.getElementById("root"));
    const floor = ownerProjectManifest.floors[0];
    const wallId = "ground-service-divider";
    const originalItems = ownerHomeProject.sceneItems.filter((item) => item.floorId === floor.id);
    const attached = originalItems.filter(
      (item) => item.placement.kind === "wall" && item.placement.wallId === wallId,
    );
    assert.ok(attached.length > 0);
    let construction, furnishing, dependencies;
    function Harness() {
      construction = useConstructEditor(floor);
      furnishing = useFurnishingEditor(originalItems);
      dependencies = useSceneItemDependencies(
        furnishing,
        construction.previewFloor,
        construction.wallRuns,
      );
      return null;
    }
    const assertRenderable = (items = furnishing.items) => {
      assert.ok(
        items.every((item) => item.placement.kind !== "wall" || item.placement.wallId !== wallId),
      );
      for (const item of items)
        assert.doesNotThrow(() => resolveItemTransform(item.placement, construction.previewFloor));
    };
    const deleteWall = async () => {
      await act(async () => construction.selectWall(wallId));
      await act(async () => construction.deleteSelected());
      assert.ok(!construction.previewFloor.walls.some((wall) => wall.id === wallId));
    };
    try {
      await act(async () => root.render(createElement(Harness)));
      await act(async () => furnishing.select(attached[0].id));
      await deleteWall();
      assertRenderable();
      assert.equal(furnishing.selectedId, attached[0].id);
      assert.equal(furnishing.items.length, originalItems.length);
      for (const original of attached) {
        const detached = furnishing.items.find((item) => item.id === original.id);
        assert.equal(detached.placement.kind, "absolute");
        assert.deepEqual(
          resolveItemTransform(detached.placement, construction.previewFloor),
          resolveItemTransform(original.placement, floor),
        );
      }
      const saved = projectFromEditorState(
        ownerHomeProject,
        construction.previewFloor,
        dependencies.items,
      );
      assertRenderable(
        JSON.parse(JSON.stringify(saved)).sceneItems.filter((item) => item.floorId === floor.id),
      );
      assert.ok(saved.floors[0].openings.every((opening) => opening.wallId !== wallId));
      assert.ok(
        saved.floors[0].wallJunctions.every((junction) => !junction.wallIds.includes(wallId)),
      );
      assert.deepEqual(
        Object.keys(saved.openingProfiles).sort(),
        saved.floors.flatMap((floor) => floor.openings.map((opening) => opening.id)).sort(),
      );

      // Starting any drag renders the entire mutable item array, not just its target.
      const detachedItems = furnishing.items;
      const other = furnishing.items.find(
        (item) =>
          item.placement.kind === "absolute" &&
          !attached.some((candidate) => candidate.id === item.id),
      );
      assert.ok(other);
      await act(async () => furnishing.beginTransaction());
      assertRenderable();
      assertRenderable(furnishing.transaction.items);
      await act(async () =>
        furnishing.updatePlacement(other.id, { ...other.placement, at: [2, 3] }),
      );
      assertRenderable();
      await act(async () => furnishing.cancelTransaction());
      assert.deepEqual(furnishing.items, detachedItems);
      await act(async () => furnishing.beginTransaction());
      await act(async () => furnishing.rotate(attached[0].id, 0.7));
      await act(async () => furnishing.commitTransaction());
      assert.equal(
        furnishing.items.find((item) => item.id === attached[0].id).placement.rotationYRadians,
        0.7,
      );
      await act(async () => furnishing.duplicate(attached[0].id, construction.previewFloor));
      assertRenderable();

      // Shared undo restores architecture and items together; redo detaches again.
      await act(async () => {
        construction.replaceFloor(floor);
        furnishing.replaceItems(originalItems, attached[0].id);
      });
      assert.deepEqual(
        furnishing.items.find((item) => item.id === attached[0].id),
        attached[0],
      );
      await deleteWall();
      assertRenderable();
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { create } from "@react-three/test-renderer";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { BoxGeometry, Mesh, MeshBasicMaterial, Quaternion, Ray, Scene, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { encodePortalState, decodePortalState } = await load(
    "/packages/walk-laser/src/portals/portal-state-codec.ts",
  );
  const { targetPortal } = await load("/packages/walk-laser/src/portals/portal-target.ts");
  const { validateRestoredPortals } = await load(
    "/packages/walk-laser/src/portals/portal-restoration.ts",
  );
  const { updateWorkspaceToolState } = await load(
    "/apps/web/src/workspaces/workspace-tool-state.ts",
  );
  const {
    createEmptyHomeProject,
    createSeedProjectRecord,
    createHomeProjectRepository,
    createMemoryProjectRecordStore,
    parseHomeProjectSchema,
    copyWorkspaceRecord,
    serializeHomeProject,
    parseHomeProject,
  } = await load("/packages/engine/src/home-project/index.ts");
  const { usePortalState } = await load("/packages/walk-laser/src/portals/usePortalState.ts");
  const { WalkToolStorageProvider } = await load(
    "/packages/engine/src/walk-tools/WalkToolStorage.tsx",
  );
  const { PortalSurface } = await load("/packages/walk-laser/src/portals/PortalSurface.tsx");
  const anchor = (x = 0) => ({
    center: new Vector3(x, 1.18, 0.018),
    normal: new Vector3(0, 0, 1),
    rotation: new Quaternion(),
    landing: { x, z: 0.72, elevation: 0, floorId: "ground" },
  });
  const state = () => ({ pair: { blue: anchor(), gold: anchor(4) }, next: "gold" });
  test("portal codec round-trips vectors, orientations, landings and alternating color", () => {
    const restored = decodePortalState(JSON.parse(JSON.stringify(encodePortalState(state()))));
    assert.deepEqual(encodePortalState(restored), encodePortalState(state()));
    assert.equal(typeof restored.pair.blue.center.distanceTo, "function");
    for (const value of [null, {}, { version: 2, pair: {} }, { version: 1, pair: { blue: {} } }])
      assert.deepEqual(decodePortalState(value).pair, {});
    for (const field of ["center", "normal", "rotation"]) {
      const value = encodePortalState(state());
      value.pair.blue[field][0] = Infinity;
      assert.equal(decodePortalState(value).pair.blue, undefined);
    }
    const malformed = encodePortalState(state());
    malformed.pair.blue.rotation = [1, 0, 0, 0];
    assert.equal(decodePortalState(malformed).pair.blue, undefined);
  });
  test("tool storage survives reload, copy and export without publishing the editor draft", async () => {
    const repository = createHomeProjectRepository(createMemoryProjectRecordStore(), {
      furnishingModels: {},
      deviceModels: {},
    });
    let record = await repository.replace(
      createSeedProjectRecord(createEmptyHomeProject("test-home", "Home"), 0),
    );
    record = {
      ...record,
      draft: { ...record.draft, home: { ...record.draft.home, name: "Pending edit" } },
    };
    const value = encodePortalState(state());
    record = await repository.replace(
      updateWorkspaceToolState(record, "cabane.laser", value),
      record.revision,
    );
    const loaded = await repository.load(record.homeId);
    assert.deepEqual(loaded.published.toolState["cabane.laser"], value);
    assert.equal(loaded.published.home.name, "Home");
    assert.equal(loaded.draft.home.name, "Pending edit");
    assert.deepEqual(
      copyWorkspaceRecord(loaded, "duplicate", "Copy").published.toolState,
      loaded.published.toolState,
    );
    assert.deepEqual(
      parseHomeProject(serializeHomeProject(loaded.published)).project.toolState,
      loaded.published.toolState,
    );
    const removed = { ...state(), pair: { gold: anchor(4) } };
    record = await repository.replace(
      updateWorkspaceToolState(loaded, "cabane.laser", encodePortalState(removed)),
      loaded.revision,
    );
    assert.equal(
      decodePortalState((await repository.load(record.homeId)).published.toolState["cabane.laser"])
        .pair.blue,
      undefined,
    );
    await assert.rejects(
      repository.replace(updateWorkspaceToolState(loaded, "cabane.laser", value), loaded.revision),
      /changed in another tab/,
    );
    assert.equal(parseHomeProjectSchema({ ...loaded.published, toolState: [] }).valid, false);
    assert.equal(
      parseHomeProjectSchema({ ...loaded.published, toolState: { "cabane.laser": () => null } })
        .valid,
      false,
    );
  });
  test("portal targeting respects ellipse bounds, nearest occlusion, front face and range", () => {
    const pair = state().pair;
    const ray = new Ray(new Vector3(0, 1.52, 4), new Vector3(0, 0, -1));
    assert.equal(targetPortal(ray, pair, 4).color, "blue");
    assert.equal(targetPortal(ray, pair, 2), null);
    ray.origin.x = 0.6;
    assert.equal(targetPortal(ray, pair, 4), null);
    ray.origin.set(0, 2.3, 4);
    assert.equal(targetPortal(ray, pair, 4), null);
    ray.origin.set(0, 1.18, -4);
    ray.direction.set(0, 0, 1);
    assert.equal(targetPortal(ray, pair, 30), null);
    ray.origin.set(0, 1.18, 40);
    ray.direction.set(0, 0, -1);
    assert.equal(targetPortal(ray, pair, 50), null);
  });
  test("restoration drops deleted support and blocked landings", () => {
    const scene = new Scene();
    const wall = new Mesh(new BoxGeometry(6, 3, 0.2), new MeshBasicMaterial());
    wall.position.set(0, 1.5, -0.1);
    scene.add(wall);
    const pair = { blue: anchor() };
    const navigation = {
      resolveLanding: (p) => ({ x: p.x, z: p.z, elevation: 0, floorId: "ground" }),
    };
    assert.equal(validateRestoredPortals(pair, scene, navigation).blue, pair.blue);
    wall.raycast = () => false;
    assert.equal(
      validateRestoredPortals(pair, scene, navigation).blue,
      pair.blue,
      "inactive floor picking does not discard a saved portal",
    );
    assert.deepEqual(validateRestoredPortals(pair, scene, { resolveLanding: () => null }), {});
    scene.remove(wall);
    assert.deepEqual(validateRestoredPortals(pair, scene, navigation), {});
    wall.geometry.dispose();
    wall.material.dispose();
  });
  test("failed injected saves restore portal state and serialize rapid actions", async () => {
    let observed, rejectWrite, operation;
    const storage = {
      read: () => encodePortalState(state()),
      write: () =>
        new Promise((_, reject) => {
          rejectWrite = reject;
        }),
    };
    function Observe() {
      observed = usePortalState();
      return null;
    }
    const renderer = await create(
      React.createElement(WalkToolStorageProvider, { storage }, React.createElement(Observe)),
    );
    await act(async () => {
      operation = observed.commit({ pair: {}, next: "blue" });
    });
    assert.deepEqual(observed.state.pair, {});
    assert.equal(await observed.commit(state()), false);
    await act(async () => {
      rejectWrite(new Error("Quota exceeded"));
      await operation;
    });
    assert.deepEqual(encodePortalState(observed.state), encodePortalState(state()));
    assert.equal(observed.pending.current, false);
    await renderer.unmount();
  });
  test("closing collapses the entrance once, with a still reduced-motion alternative", async () => {
    for (const reducedMotion of [false, true]) {
      let closed = 0;
      const renderer = await create(
        React.createElement(PortalSurface, {
          anchor: anchor(),
          color: "blue",
          reducedMotion,
          closing: true,
          onClosed: () => closed++,
        }),
      );
      const opening = renderer.scene.findByProps({ name: "portal-opening" }).instance;
      assert.equal(opening.scale.x, 1);
      await act(async () => {
        await renderer.advanceFrames(1, 0.1);
      });
      assert.equal(closed, 0);
      if (reducedMotion) assert.equal(opening.scale.x, 1);
      await act(async () => {
        await renderer.advanceFrames(1, 0.2);
      });
      if (!reducedMotion) assert.ok(opening.scale.x > 0 && opening.scale.x < 0.7);
      await act(async () => {
        await renderer.advanceFrames(3, 0.2);
      });
      assert.equal(closed, 1);
      if (!reducedMotion) assert.equal(opening.scale.x, 0);
      await renderer.unmount();
    }
  });
});

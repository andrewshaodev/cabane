import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshToonMaterial,
  PlaneGeometry,
} from "three";
import { withModules } from "./test-server.mjs";
import { findOverlaps } from "../scripts/surface-overlaps.mjs";
import { inspectLayeredSurfaces } from "../scripts/layered-surface-contract.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const definition = { preferredPlacement: "floor", bounds: { min: [-1, 0, -1] } };
function plane(color = "red") {
  return new Mesh(new PlaneGeometry(1, 1), new MeshToonMaterial({ color }));
}
function scene(...objects) {
  const root = new Group();
  root.add(...objects);
  return root;
}
function dispose(root) {
  root.traverse((mesh) => {
    mesh.geometry?.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      material?.dispose();
  });
}

test("surface audit detects competing coplanar faces, but not edges or separated planes", () => {
  const first = plane();
  const second = plane("blue");
  second.position.x = 0.4;
  const root = scene(first, second);
  try {
    assert.ok(findOverlaps(root, definition).length);
    root.rotation.set(0.3, 0.5, 0.2);
    root.scale.set(2, 1.3, 0.8);
    assert.ok(findOverlaps(root, definition).length, "world transforms retain the conflict");
    second.position.x = 1;
    assert.deepEqual(findOverlaps(root, definition), [], "shared edges are not overlapping faces");
    second.position.x = 0;
    second.position.z = 0.002;
    assert.deepEqual(findOverlaps(root, definition), []);
    second.position.z = 0;
    second.visible = false;
    assert.deepEqual(findOverlaps(root, definition), []);
  } finally {
    dispose(root);
  }
});

test("surface audit catches duplicate meshes and duplicate triangles within one geometry", () => {
  const root = scene(plane(), plane());
  try {
    assert.ok(findOverlaps(root, definition).length, "same-colour duplicate meshes still fail");
    const removed = root.children[1];
    root.remove(removed);
    dispose(removed);
    const mesh = root.children[0];
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
    );
    mesh.geometry.dispose();
    mesh.geometry = geometry;
    assert.ok(findOverlaps(root, definition).length);
    geometry.setDrawRange(0, 3);
    assert.deepEqual(findOverlaps(root, definition), [], "unused buffer triangles do not render");
  } finally {
    dispose(root);
  }
});

test("surface audit uses each triangle's material group", () => {
  const root = scene(plane());
  const mesh = root.children[0];
  try {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0.1, 0, 0, 1.1, 0, 0, 0.1, 1, 0], 3),
    );
    geometry.addGroup(0, 3, 0);
    geometry.addGroup(3, 3, 1);
    mesh.geometry.dispose();
    mesh.geometry = geometry;
    mesh.material = [mesh.material, new MeshToonMaterial({ color: "blue" })];
    assert.ok(findOverlaps(root, definition).length);
  } finally {
    dispose(root);
  }
});

await withModules(async (load) => {
  const { LayeredSurface } = await load("/packages/engine/src/layered-surfaces/index.ts");
  test("layered surfaces retain occlusion and only exempt correctly separated paint layers", async () => {
    const paint = (layer, color) =>
      createElement(
        LayeredSurface,
        { layer, color },
        createElement("planeGeometry", { args: [1, 1] }),
      );
    const renderer = await create(createElement("group", null, paint(1, "red"), paint(2, "blue")));
    try {
      const root = renderer.scene.instance;
      const meshes = [];
      root.traverse((object) => {
        if (object.isMesh) meshes.push(object);
      });
      assert.deepEqual(inspectLayeredSurfaces(root), []);
      for (const mesh of meshes) {
        assert.equal(mesh.material.depthTest, true);
        assert.equal(mesh.material.depthWrite, true);
        // Exercise actual coplanar geometry, independent of the tiny physical offset.
        mesh.position.z = 0;
      }
      assert.deepEqual(findOverlaps(root, definition), []);
      meshes[1].userData.cabaneSurfaceLayer = 1;
      meshes[1].material.polygonOffsetUnits = -4;
      assert.ok(findOverlaps(root, definition).length, "reusing a layer fails");
      meshes[1].userData.cabaneSurfaceLayer = 2;
      assert.ok(inspectLayeredSurfaces(root).length, "metadata cannot exempt an incorrect bias");
      assert.ok(findOverlaps(root, definition).length);
      meshes[1].material.polygonOffsetUnits = -8;
      meshes[1].material.depthTest = false;
      assert.ok(inspectLayeredSurfaces(root).length);
      meshes[1].material.depthTest = true;
      meshes[1].geometry.attributes.position.setZ(0, 0.1);
      assert.ok(inspectLayeredSurfaces(root).length, "volume geometry is not flat artwork");
    } finally {
      await renderer.unmount();
    }
    for (const layer of [-1, 0.5, 65, NaN, Infinity])
      assert.throws(() => LayeredSurface({ layer, children: null }), /integer from 0 to 64/);
  });
});

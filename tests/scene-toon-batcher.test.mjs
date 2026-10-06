import assert from "node:assert/strict";
import test from "node:test";
import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshToonMaterial,
  PerspectiveCamera,
  Scene,
} from "three";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { SceneToonBatcher } = await load(
    "/packages/engine/src/scene-batching/SceneToonBatcher.ts",
  );
  const { registerGeometryLods } = await load(
    "/packages/engine/src/scene-batching/geometry-lod-family.ts",
  );
  function fixture() {
    const scene = new Scene(),
      camera = new PerspectiveCamera(),
      batcher = new SceneToonBatcher();
    const a = new Mesh(new BoxGeometry(), new MeshToonMaterial({ color: "red" }));
    const b = new Mesh(new BoxGeometry(), new MeshToonMaterial({ color: "blue" }));
    const child = new Mesh(
      new BoxGeometry(),
      new MeshToonMaterial({ transparent: true, opacity: 0.5 }),
    );
    a.add(child);
    scene.add(a, b);
    const renderer = {
      extensions: { has: () => true },
      localClippingEnabled: false,
      clippingPlanes: [],
      render() {},
    };
    return { scene, camera, batcher, a, b, child, renderer };
  }
  test("batches colors and transforms while retaining children and restoring originals", () => {
    const f = fixture(),
      original = f.a.material;
    f.a.position.x = 2;
    let previous;
    f.renderer.render = (scene) => {
      const batch = scene.children.find((object) => object.isBatchedMesh);
      assert.ok(batch);
      assert.equal(f.child.material.visible, true);
      const matrix = new Matrix4();
      batch.getMatrixAt(0, matrix);
      assert.deepEqual(matrix.elements, new Matrix4().elements);
      assert.equal(batch.geometry.attributes.position.getX(0), 2.5);
      assert.equal(batch.geometry.attributes.color.getX(0), 1);
      if (previous) {
        assert.equal(batch, previous);
        assert.equal(batch.getVisibleAt(0), false);
        assert.equal(f.a.material, original);
      } else assert.equal(f.a.material.visible, false);
      previous = batch;
    };
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.a.position.x = 3;
    original.color.set("green");
    f.batcher.render(f.renderer, f.scene, f.camera);
    assert.equal(f.a.material, original);
    assert.equal(f.scene.children.length, 2);
    f.batcher.dispose();
  });
  test("camera LOD/fade/visibility changes reuse every GPU buffer and preserve fallback draws", () => {
    const f = fixture(),
      source = f.a.geometry,
      low = new BoxGeometry(0.9, 0.9, 0.9),
      original = f.a.material;
    registerGeometryLods(source, [low]);
    original.userData.cameraFadeBaseOpacity = 1;
    original.userData.cameraFadeBaseTransparent = false;
    original.userData.cameraFadeBaseDepthWrite = true;
    f.a.userData.cameraFadeBaseCastShadow = false;
    let batch, buffers;
    f.renderer.render = (scene) => {
      const current = scene.children.find((object) => object.isBatchedMesh);
      assert.ok(current);
      if (batch) {
        assert.equal(current, batch);
        assert.equal(current.geometry, buffers);
      }
      batch = current;
      buffers = current.geometry;
      const faded = original.opacity < 1;
      assert.equal(current.getVisibleAt(0), !faded && f.a.visible);
      if (faded) assert.equal(f.a.material, original);
    };
    for (let frame = 0; frame < 90; frame++) {
      f.camera.position.x = frame / 10;
      f.a.geometry = frame % 2 ? low : source;
      original.transparent = frame % 3 === 0;
      original.opacity = original.transparent ? 0.5 : 1;
      original.depthWrite = !original.transparent;
      original.needsUpdate = true;
      f.a.visible = frame % 5 !== 0;
      f.batcher.render(f.renderer, f.scene, f.camera);
    }
    assert.equal(f.a.material, original);
    f.batcher.dispose();
  });
  test("preserves all instances instead of treating an InstancedMesh as one ordinary mesh", () => {
    const f = fixture();
    const instances = new InstancedMesh(f.a.geometry, f.a.material, 10);
    f.scene.add(instances);
    f.renderer.render = () => {
      assert.equal(instances.material.visible, true);
      assert.equal(instances.count, 10);
    };
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.batcher.dispose();
  });
  test("restores scene after render failure and falls back without multi-draw", () => {
    const f = fixture(),
      original = f.a.material;
    f.renderer.render = () => {
      throw new Error("render failed");
    };
    assert.throws(() => f.batcher.render(f.renderer, f.scene, f.camera), /render failed/);
    assert.equal(f.a.material, original);
    assert.equal(f.scene.children.length, 2);
    f.renderer.extensions.has = () => false;
    f.renderer.render = (scene) => {
      assert.equal(scene.children.length, 2);
      assert.equal(f.a.material, original);
    };
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.batcher.dispose();
  });
  test("geometry changes rebuild; transparent and custom render objects stay unbatched", () => {
    const f = fixture();
    let previous;
    f.renderer.render = (scene) => {
      const batch = scene.children.find((object) => object.isBatchedMesh);
      assert.ok(batch);
      if (previous) assert.notEqual(batch, previous);
      previous = batch;
    };
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.a.geometry.attributes.position.needsUpdate = true;
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.a.onBeforeRender = () => {};
    f.renderer.render = (scene) => assert.equal(scene.children.length, 2);
    f.batcher.render(f.renderer, f.scene, f.camera);
    f.batcher.dispose();
  });
});

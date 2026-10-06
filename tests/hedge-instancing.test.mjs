import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { create } from '@react-three/test-renderer';
import { Box3, CylinderGeometry, IcosahedronGeometry, Matrix4, Object3D, Raycaster, SphereGeometry, Vector3 } from 'three';
import { withModules } from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { BushyHedge } = await load('/packages/engine/src/hedges/BushyHedge.tsx');
  const { RoundedHedge } = await load('/packages/engine/src/hedges/RoundedHedge.tsx');
  const compare = (mesh, index, geometry, transform) => {
    for (const attribute of ['position', 'normal', 'uv']) assert.deepEqual(mesh.geometry.attributes[attribute].array, geometry.attributes[attribute].array);
    assert.deepEqual(mesh.geometry.index?.array, geometry.index?.array);
    const matrix = new Matrix4(); mesh.getMatrixAt(index, matrix); transform.updateMatrix();
    matrix.elements.forEach((v, i) => assert.ok(Math.abs(v - transform.matrix.elements[i]) < 1e-6, 'instance preserves local transform within float32 precision'));
    const bounds = new Box3().setFromBufferAttribute(geometry.attributes.position).applyMatrix4(matrix);
    assert.ok(mesh.boundingBox.clone().expandByScalar(1e-6).containsBox(bounds), 'batch bounds cover every instance');
  };
  test('bushy hedges preserve all original solids, colors, transforms and shadows, including resizing', async () => {
    const renderer = await create(createElement(BushyHedge, { length: 3, height: 1.4, width: .6 }));
    try { for (const [length, height, width] of [[3, 1.4, .6], [.1, .8, 1], [8, 2.2, .4]]) {
      await renderer.update(createElement(BushyHedge, { length, height, width }));
      const meshes = renderer.scene.findAll(n => n.instance.isInstancedMesh).map(n => n.instance);
      const count = Math.min(180, Math.max(2, Math.ceil(length / (width * .3))));
      assert.equal(meshes.length, 4); assert.equal(meshes.reduce((sum, m) => sum + m.count, 0), count * 2);
      for (let i = 0; i < count; i++) {
        const t = new Object3D(), x = -length / 2 + (i + .5) * length / count;
        t.position.set(x, height * .22, 0); compare(meshes[0], i, new CylinderGeometry(.025, .045, height * .44, 5), t);
        t.position.set(x, height * .52, Math.sin(i * 2.4) * width * .08); t.rotation.y = i * 1.7;
        t.scale.set(Math.min(width * .6, length / 2), height * .48 * (.86 + Math.sin(i * 7.31) * .12), width * .42);
        const leaf = meshes[1 + i % 3]; compare(leaf, Math.floor(i / 3), new IcosahedronGeometry(1, 1), t);
        assert.equal(leaf.material.color.getHexString(), ['76934a', '4f773e', '628443'][i % 3]); assert.equal(leaf.receiveShadow, true);
      }
      assert.ok(meshes.every(m => m.castShadow));
    } } finally { await renderer.unmount(); }
  });
  test('rounded hedge retains sphere detail and raycast occlusion after batching', async () => {
    const length = 3, height = 1.4, width = .6;
    const renderer = await create(createElement(RoundedHedge, { length, height, width }));
    try {
      const mesh = renderer.scene.find(n => n.instance.isInstancedMesh).instance;
      const count = Math.min(160, Math.max(1, Math.ceil(length / (width * .45))));
      assert.equal(mesh.count, count);
      for (let i = 0; i < count; i++) {
        const t = new Object3D(); t.position.set(-length / 2 + (i + .5) * length / count, height / 2, 0); t.scale.set(Math.min(width * .65, length / 2), height / 2, width / 2);
        compare(mesh, i, new SphereGeometry(1, 10, 8), t);
      }
      mesh.updateMatrixWorld(true);
      assert.ok(new Raycaster(new Vector3(0, height / 2, 3), new Vector3(0, 0, -1)).intersectObject(mesh).length > 0);
    } finally { await renderer.unmount(); }
  });
});

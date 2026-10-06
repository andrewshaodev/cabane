import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { create } from '@react-three/test-renderer';
import { RoundedBox as Original } from '@react-three/drei';
import { withModules } from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { roundedBoxGeometry } = await load('/packages/engine/src/rounded-box/rounded-box-geometry.ts');
  test('cached rounded boxes preserve Drei positions, normals, UVs and groups', async () => {
    for (const [size, radius, smoothness, bevelSegments] of [
      [[1, 1, 1], .05, 4, 4], [[.07, .07, .049], .012, 2, 4],
      [[2, .025, .6], .006, 2, 2], [[.12, .12, .025], .018, 2, 4],
    ]) {
      const renderer = await create(createElement(Original, { args: size, radius, smoothness, bevelSegments }));
      const original = renderer.scene.findByType('Mesh').instance.geometry;
      const actual = roundedBoxGeometry(...size, radius, 1, smoothness, bevelSegments, .4);
      for (const name of ['position', 'normal', 'uv']) assert.deepEqual(actual.attributes[name].array, original.attributes[name].array, name);
      assert.deepEqual(actual.groups, original.groups);
      const reused = roundedBoxGeometry(...size, radius, 1, smoothness, bevelSegments, .4);
      actual.attributes.position.array[0] = 999;
      actual.dispose();
      assert.deepEqual(reused.attributes.position.array, original.attributes.position.array, 'independent mutable ownership');
      reused.dispose();
      await renderer.unmount();
    }
  });
});

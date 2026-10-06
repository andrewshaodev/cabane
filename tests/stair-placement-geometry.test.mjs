import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { create } from '@react-three/test-renderer';
import { Vector3, Raycaster } from 'three';
import { withModules } from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { StairPlan } = await load('/packages/engine/src/stairs/models/StairPlan.tsx');
  const { stairFromEndpoints } = await load('/apps/web/src/editor-floors/stair-placement-geometry.ts');
  const { deriveStairFlight } = await load('/packages/engine/src/stairs/flight-geometry.ts');
  const { makeStairProject } = await load('/tests/fixtures/multiple-floors.ts');
  test('preview and saved stair center-line endpoints agree in every quadrant and coordinate scale', async () => {
    for (const coordinates of [{origin:[0,0],metersPerPlanUnit:1},{origin:[17,-9],metersPerPlanUnit:.25}]) {
      const building = {...makeStairProject(),coordinates};
      for (const [x,z] of [[5,6],[-1,6],[5,-2],[-1,-2],[2,6],[5,2]]) {
        const stair = stairFromEndpoints(building.stairs[0],coordinates,{x:2,z:2},{x,z});
        const flight = deriveStairFlight(building,stair);
        const renderer = await create(createElement(StairPlan,{flight}));
        try {
          const hit=renderer.scene.findByProps({name:`stair-plan-hit-${stair.id}`}).instance;
          hit.updateWorldMatrix(true,false);
          const from=hit.localToWorld(new Vector3(0,0,-stair.runMeters/2));
          const to=hit.localToWorld(new Vector3(0,0,stair.runMeters/2));
          assert.ok(Math.hypot(from.x-2,from.z-2)<.006);
          assert.ok(Math.hypot(to.x-x,to.z-z)<.006,`end ${x},${z}: got ${to.x},${to.z}`);
        } finally {await renderer.unmount();}
      }
    }
  });
  test('switching from another tool to Select restores stair hit testing on both floors', async () => {
    const building = makeStairProject();
    const flight = deriveStairFlight(building,building.stairs[0]);
    for (const upper of [false,true]) {
      const renderer = await create(createElement(StairPlan,{flight,upper}));
      try {
        await renderer.update(createElement(StairPlan,{flight,upper,onSelect(){}}));
        const hit=renderer.scene.findByProps({name:`stair-plan-hit-${flight.id}`}).instance;
        hit.updateWorldMatrix(true,false);
        const center=hit.getWorldPosition(new Vector3());
        const ray = new Raycaster(new Vector3(center.x,10,center.z),new Vector3(0,-1,0));
        assert.ok(ray.intersectObject(hit).length>0,'stair must be clickable after tool changes');
      } finally {await renderer.unmount();}
    }
  });
  test('a click without meaningful length cannot create a degenerate staircase', () => {
    const building=makeStairProject();
    assert.equal(stairFromEndpoints(building.stairs[0],building.coordinates,{x:2,z:2},{x:2,z:2}),null);
  });
});

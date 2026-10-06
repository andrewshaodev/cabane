import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {create} from '@react-three/test-renderer';
import {Vector3,Raycaster} from 'three';
import {withModules} from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
await withModules(async load=>{
  const {StairPlan}=await load('/packages/engine/src/stairs/models/StairPlan.tsx');
  const {deriveStairFlight}=await load('/packages/engine/src/stairs/flight-geometry.ts');
  const {makeStairProject}=await load('/tests/fixtures/multiple-floors.ts');
  test('plan hit geometry follows a spiral circle and an L footprint rather than a straight rectangle',async()=>{
    const project=makeStairProject(),base={id:'shape',lowerFloorId:'ground',upperFloorId:'first',at:[3,2],rotationYRadians:0};
    for(const [stair,inside,outside] of [
      [{...base,shape:'spiral',diameterMeters:2,totalTurnDegrees:270,direction:'clockwise'},[3,2],[3.9,2.9]],
      [{...base,shape:'l-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:2,turn:'right'},[5,4.5],[5,2.5]],
    ]) {
      const f=deriveStairFlight(project,stair),renderer=await create(createElement(StairPlan,{flight:f,onSelect(){}}));
      try {
        const hit=renderer.scene.findByProps({name:'stair-plan-hit-shape'}).instance;
        hit.updateWorldMatrix(true,false);
        const ray=(p)=>new Raycaster(new Vector3(p[0],10,p[1]),new Vector3(0,-1,0)).intersectObject(hit);
        assert.ok(ray(inside).length>0);
        assert.equal(ray(outside).length,0);
      } finally {await renderer.unmount();}
    }
  });
});
await withModules(async load=>{
  const {ShapedStairGuards}=await load('/packages/engine/src/stairs/models/ShapedStairGuards.tsx');
  const {deriveStairFlight}=await load('/packages/engine/src/stairs/flight-geometry.ts');
  const {makeStairProject}=await load('/tests/fixtures/multiple-floors.ts');
  const {Matrix4}=await import('three');
  test('L-shaped rails protect the lower flight and stay level over its landing',async()=>{
    const project=makeStairProject();
    const f=deriveStairFlight(project,{id:'l',shape:'l-shaped',lowerFloorId:'ground',upperFloorId:'first',at:[3,2],rotationYRadians:0,widthMeters:1,lowerRunMeters:2,upperRunMeters:2,turn:'right'});
    const renderer=await create(createElement(ShapedStairGuards,{flight:f,coordinates:project.coordinates}));
    try {
      const rails=renderer.scene.findAll(n=>n.instance.isInstancedMesh).flatMap(n=>{
        const segments=[];
        for(let i=0;i<n.instance.count;i++) {
          const matrix=new Matrix4();n.instance.getMatrixAt(i,matrix);
          segments.push([new Vector3(0,0,-.5).applyMatrix4(matrix),new Vector3(0,0,.5).applyMatrix4(matrix)]);
        }
        return segments;
      });
      const lower=rails.filter(([a,b])=>Math.abs(a.x-2.5)<.001&&Math.abs(b.x-2.5)<.001&&a.z<3.9&&b.z<4.01&&Math.abs(a.z-b.z)>.01);
      assert.ok(lower.length>0,'lower side rails must exist');
      const landing=rails.filter(([a,b])=>Math.abs(a.x-2.5)<.001&&Math.abs(b.x-2.5)<.001&&a.z>=4-1e-6&&b.z>=4-1e-6&&Math.abs(a.z-b.z)>.01);
      assert.ok(landing.length>0,'landing must have a horizontal side rail');
      for(const [a,b] of landing) {
        assert.ok(Math.abs(a.y-2.35)<.001);assert.ok(Math.abs(b.y-2.35)<.001);
      }
    }finally{await renderer.unmount();}
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { create } from '@react-three/test-renderer';
import { withModules } from './test-server.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
await withModules(async load=>{
  const { createTerrainSupportQuery }=await load('/packages/engine/src/navigation/terrain-support.ts');
  const { resolveWalkLanding }=await load('/packages/engine/src/navigation/walk-landing.ts');
  const { DioramaGround }=await load('/packages/engine/src/architecture-scene/DioramaGround.tsx');
  const { neutralDemoManifest }=await load('/packages/engine/src/demo.ts');
  test('terrain landings use the rendered outline and pool holes, without relaxing other-floor or obstacle checks',async()=>{
    const floor=structuredClone(neutralDemoManifest.floors[0]);
    floor.pools=[{id:'pool',polygon:[[5,0],[7,0],[7,2],[5,2]]}];
    const building={coordinates:floor.coordinates,floors:[floor,{...floor,id:'upper'}],stairs:[],sceneItems:[]};
    const renderer=await create(createElement(DioramaGround,{floor,centerX:2.4,centerZ:1.8,size:12,color:'#91a06a'}));
    try {
      const scene=renderer.scene.instance;
      const supports=createTerrainSupportQuery(scene);
      assert.equal(supports({x:2.4,z:5}),true,'rendered terrain support');
      const land=(x,z,y=0,obstacles=[])=>resolveWalkLanding(building,{x,y,z},()=>obstacles,supports);
      assert.ok(land(2.4,5),'outdoor terrain supports relocation');
      assert.equal(land(6,1),null,'pool interior has no support');
      assert.equal(land(7.1,1),null,'the whole player radius must clear the pool cutout');
      assert.equal(land(8.3,4),null,'terrain edge does not support the whole player');
      assert.equal(land(40,4),null,'void beyond the diorama');
      assert.equal(land(2.4,5,2.8),null,'terrain cannot support an upper-floor exit');
      assert.equal(land(2.4,3.6),null,'wall collision still rejects a landing');
      assert.equal(land(2.4,5,0,[{kind:'box',id:'obstacle',minX:2,maxX:3,minZ:4,maxZ:6}]),null);
      const terrain=scene.getObjectByName('diorama-ground');
      terrain.raycast=()=>undefined;
      assert.ok(land(2.4,5),'support remains available while another storey owns interaction picking');
      assert.equal(resolveWalkLanding(building,{x:2.4,y:0,z:5},()=>[]),null,'no terrain inference without injected geometry support');
    } finally {await renderer.unmount();}
  });
});

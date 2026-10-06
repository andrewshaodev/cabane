import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement, act } from 'react';
import { create } from '@react-three/test-renderer';
import { withModules } from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async load => {
  const { useAdjacentFloorReferences } = await load('/apps/web/src/editor-floors/useAdjacentFloorReferences.ts');
  const { AdjacentFloorGuide } = await load('/apps/web/src/editor-floors/AdjacentFloorGuide.tsx');
  const { makeThreeFloorProject } = await load('/tests/fixtures/multiple-floors.ts');
  const source = makeThreeFloorProject().floors[0];
  const floors = [-2,-1,0,1,2].map(level => ({ ...source, id:String(level), belowGround:level<0,
    walls:[{...source.walls[0],id:`wall-${level}`,from:[level,0],to:[level,4]}] }));
  let references;
  function Probe({activeFloorId, floors}) {
    references=useAdjacentFloorReferences(floors,activeFloorId);
    return createElement('group',{},references.references.filter(r=>r.visible).map(r=>
      createElement(AdjacentFloorGuide,{key:r.direction,direction:r.direction,floor:r.floor})));
  }
  test('basement and upper-floor references use the same adjacent levels, guides and snapping',async()=>{
    const renderer=await create(createElement(Probe,{floors,activeFloorId:'-1'}));
    try {
      for(const level of [-1,0,1]) {
        await renderer.update(createElement(Probe,{floors,activeFloorId:String(level)}));
        assert.deepEqual(references.references.map(r=>[r.direction,r.floor.id]),[['above',String(level+1)],['below',String(level-1)]]);
        assert.deepEqual(references.referenceWalls.map(w=>w.id),[`wall-${level+1}`,`wall-${level-1}`]);
        for(const direction of ['above','below']) {
          const guide=renderer.scene.findByProps({name:`adjacent-floor-guide-${direction}`});
          assert.equal(guide.instance.userData.floorId,String(level+(direction==='above'?1:-1)));
          assert.equal(guide.findAllByType('Mesh').length,1);
        }
      }
      await act(async()=>references.setVisible('above',false));
      assert.deepEqual(references.referenceWalls.map(w=>w.id),['wall-0']);
      assert.equal(renderer.scene.findAllByProps({name:'adjacent-floor-guide-above'}).length,0);
      assert.equal(renderer.scene.findAllByProps({name:'adjacent-floor-guide-below'}).length,1);
      await act(async()=>references.setVisible('below',false));
      assert.deepEqual(references.referenceWalls,[]);
      await renderer.update(createElement(Probe,{floors,activeFloorId:'-1'}));
      assert.ok(references.references.every(r=>!r.visible),'visibility choices survive floor changes');
      await act(async()=>references.setVisible('above',true));
      assert.deepEqual(references.referenceWalls.map(w=>w.id),['wall-0']);
    }finally{await renderer.unmount();}
  });
  test('outer and missing floors expose only real neighbors, including after removal',async()=>{
    const renderer=await create(createElement(Probe,{floors,activeFloorId:'-2'}));
    try {
      assert.deepEqual(references.references.map(r=>r.direction),['above']);
      await renderer.update(createElement(Probe,{floors,activeFloorId:'2'}));
      assert.deepEqual(references.references.map(r=>r.direction),['below']);
      await renderer.update(createElement(Probe,{floors:floors.slice(1),activeFloorId:'-1'}));
      assert.deepEqual(references.references.map(r=>r.direction),['above']);
      await renderer.update(createElement(Probe,{floors:[source],activeFloorId:source.id}));
      assert.deepEqual(references.references,[]);
      await renderer.update(createElement(Probe,{floors,activeFloorId:'missing'}));
      assert.deepEqual(references.references,[]);
    }finally{await renderer.unmount();}
  });
  test('outdoor-only adjacent floors render platform outlines in both directions',async()=>{
    const polygon=[[0,0],[3,0],[3,2],[0,2]];
    const floor={...source,walls:[],rooms:[],outdoorPlatforms:[{id:'terrace',polygon}]};
    for(const direction of ['above','below']) {
      const renderer=await create(createElement(AdjacentFloorGuide,{floor,direction}));
      try {
        const meshes=renderer.scene.findAllByType('Mesh');
        assert.equal(meshes.length,4,'every platform edge must appear in the guide');
        assert.ok(meshes.every(mesh=>mesh.instance.raycast()===undefined),'guides must not intercept selection');
      }finally{await renderer.unmount();}
    }
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { create } from '@react-three/test-renderer';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { BoxGeometry, Mesh, MeshBasicMaterial, Quaternion, Raycaster, Scene, Vector3 } from 'three';
import { withModules } from './test-server.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { placePortal } = await load('/packages/walk-laser/src/portals/portal-placement.ts');
  const { createPortalPair } = await load('/packages/walk-laser/src/portals/portal-pair.ts');
  const { createPortalTraversal } = await load('/packages/walk-laser/src/portals/portal-traversal.ts');
  const { PortalSurface } = await load('/packages/walk-laser/src/portals/PortalSurface.tsx');
  const { usePortalInput } = await load('/packages/walk-laser/src/portals/usePortalInput.ts');
  const { WalkCameraController } = await load('/packages/engine/src/WalkCameraController.tsx');
  const { resolveWalkLanding } = await load('/packages/engine/src/navigation/walk-landing.ts');
  const { makeStairProject } = await load('/tests/fixtures/multiple-floors.ts');
  const anchor = (x = 0, normal = new Vector3(0,0,1)) => ({
    center: new Vector3(x,1.18,0), normal, rotation: new Quaternion().setFromUnitVectors(new Vector3(0,0,1),normal),
    landing: {x,z:.72,elevation:0,floorId:'ground'},
  });
  test('pair alternates blue/gold, replaces only that color, and failed placements do not advance it', () => {
    const pair = createPortalPair();
    assert.equal(pair.place(null), null);
    const blue = anchor(), gold = anchor(4), replacement = anchor(8);
    assert.deepEqual(pair.place(blue), {blue});
    assert.equal(pair.place(anchor(.2)), null);
    assert.deepEqual(pair.place(gold), {blue,gold});
    assert.deepEqual(pair.place(replacement), {blue:replacement,gold});
    assert.deepEqual(createPortalPair().current, {});
  });

  test('placement fits a whole oval, rejects edges/devices, and requires a clear landing', () => {
    const scene = new Scene();
    const wall = new Mesh(new BoxGeometry(6,3,.2), new MeshBasicMaterial());
    wall.position.set(0,1.5,-.1); scene.add(wall); scene.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0,1.52,4),new Vector3(0,0,-1));
    const hit = ray.intersectObject(wall)[0];
    const navigation = {resolveLanding: p => ({x:p.x,z:p.z,elevation:0,floorId:'ground'})};
    const portal = placePortal(hit, scene, navigation);
    assert.ok(portal);
    assert.equal(portal.center.y, 1.18);
    assert.ok(portal.landing.z > .7);
    assert.equal(placePortal(hit, scene, {resolveLanding:()=>null}), null);
    ray.set(new Vector3(2.8,1.5,4),new Vector3(0,0,-1));
    assert.equal(placePortal(ray.intersectObject(wall)[0],scene,navigation),null);
    wall.userData.walkDeviceInteraction = {id:'device'};
    assert.equal(placePortal(hit,scene,navigation),null);
    wall.geometry.dispose(); wall.material.dispose();
  });

  test('floor placement accepts supported floors, rejects raised furniture and ceilings', () => {
    const scene = new Scene();
    const slab = new Mesh(new BoxGeometry(6,.2,6), new MeshBasicMaterial());
    slab.position.y = -.1; scene.add(slab); scene.updateMatrixWorld(true);
    const navigation = {resolveLanding:p=>({x:p.x,z:p.z,elevation:0,floorId:'ground'})};
    const ray = new Raycaster(new Vector3(0,3,0), new Vector3(0,-1,0));
    assert.ok(placePortal(ray.intersectObject(slab)[0],scene,navigation));
    slab.position.y = 1; scene.updateMatrixWorld(true);
    assert.equal(placePortal(ray.intersectObject(slab)[0],scene,navigation),null);
    ray.set(new Vector3(0,-3,0),new Vector3(0,1,0));
    assert.equal(placePortal(ray.intersectObject(slab)[0],scene,navigation),null);
    slab.geometry.dispose(); slab.material.dispose();
  });

  for (const fps of [30,60,120]) test(`wall entry teleports in both directions without bouncing at ${fps} FPS`, () => {
    const traversal = createPortalTraversal();
    const pair = {blue:anchor(),gold:anchor(4,new Vector3(1,0,0))};
    pair.gold.landing = {x:4.72,z:0,elevation:0,floorId:'ground'};
    const calls=[]; const navigation={teleport:(...args)=>{calls.push(args);return true;}};
    const step=(x,z)=>traversal.step(pair,new Vector3(x,1.52,z),{yaw:0,pitch:.1},request=>navigation.teleport(request.landing,request.facing));
    for(let z=1;z>.22;z-=2.8/fps) step(0,z);
    assert.equal(calls.length,1);
    assert.deepEqual(calls[0][0],pair.gold.landing);
    assert.ok(Math.abs(calls[0][1].yaw + Math.PI/2)<1e-8);
    for(let i=0;i<10;i++) step(4.25,0);
    assert.equal(calls.length,1,'exit cannot immediately return');
    step(4.8,0); step(5.5,0);
    for(let x=5.5;x>4.22;x-=2.8/fps) step(x,0);
    assert.equal(calls.length,2);
    assert.deepEqual(calls[1][0],pair.blue.landing);
  });

  test('unpaired, back-side, off-center, paused and obstructed travel cannot teleport', () => {
    const pair = {blue:anchor(),gold:anchor(4)};
    let calls=0;
    const navigation={teleport:()=>{calls++; return false;}};
    const traversal=createPortalTraversal();
    const step=(x,z,p=pair)=>traversal.step(p,new Vector3(x,1.52,z),{yaw:0,pitch:0},request=>navigation.teleport(request.landing,request.facing));
    step(0,.5,{blue:pair.blue}); step(0,.25,{blue:pair.blue});
    step(0,-.2); step(0,.25);
    step(.8,.5); step(.8,.25);
    assert.equal(calls,0);
    traversal.reset(); step(0,.5); assert.equal(step(0,.25),false); assert.equal(calls,1);
    traversal.reset(); assert.equal(step(0,.25),false); assert.equal(calls,1);
  });

  test('walking across a floor portal enters once and exits facing out of the wall portal', () => {
    const floor = anchor(0,new Vector3(0,1,0)); floor.center.set(0,.018,0);
    const pair = {blue:floor,gold:anchor(4)};
    const traversal=createPortalTraversal(), calls=[];
    const navigation={teleport:(...args)=>{calls.push(args);return true;}};
    for(let z=1.5;z>0;z-=.05) traversal.step(pair,new Vector3(0,1.52,z),{yaw:0,pitch:0},request=>navigation.teleport(request.landing,request.facing));
    assert.equal(calls.length,1);
    assert.ok(Math.abs(Math.abs(calls[0][1].yaw)-Math.PI)<1e-8);
  });

  test('relocation rejects voids, walls, stair interiors, occupied exits and non-finite coordinates', () => {
    const building=makeStairProject();
    const resolve=(p,f=()=>[])=>resolveWalkLanding(building,p,f);
    assert.deepEqual(resolve({x:2,y:2.6,z:2}),{x:2,z:2,floorId:'first',elevation:2.6});
    assert.equal(resolve({x:0,y:0,z:0}),null);
    assert.equal(resolve({x:40,y:0,z:40}),null);
    assert.equal(resolve({x:4,y:2.6,z:3}),null);
    assert.equal(resolve({x:2,y:12,z:2}),null);
    assert.equal(resolve({x:NaN,y:0,z:2}),null);
    assert.equal(resolve({x:2,y:0,z:2},()=>[{kind:'box',id:'chair',minX:1,maxX:3,minZ:1,maxZ:3}]),null);
  });

  test('injected controller navigation commits floor/camera/room and resets jumping; rejected teleports leave state untouched', async () => {
    const building=makeStairProject(), navigation={current:null};
    const poseRef={current:{x:2,z:2,yaw:0,pitch:0}},jumpRequestRef={current:true}, floors=[];
    const props={building,floor:building.floors[0],poseRef,toolNavigationRef:navigation,jumpRequestRef,
      movementInputRef:{current:{x:0,y:0}},lookInputRef:{current:{x:0,y:0}},lookDeltaRef:{current:{x:0,y:0}},
      reducedMotion:true,openingPositions:{},boundOpeningIds:new Set(),onOpeningsChange(){},onRoomChange(){},onFloorChange:id=>floors.push(id)};
    const renderer=await create(React.createElement(WalkCameraController,props));
    try {
      await renderer.advanceFrames(4,1/60);
      const camera=renderer.scene.findByType('PerspectiveCamera').instance;
      assert.ok(camera.position.y>1.52);
      const landing=navigation.current.resolveLanding({x:2,y:2.6,z:3}); assert.ok(landing);
      assert.equal(navigation.current.teleport(landing,{yaw:Math.PI/2,pitch:0}),true);
      assert.deepEqual(floors,['first']);
      assert.equal(camera.position.y,4.12);
      assert.equal(camera.rotation.y,Math.PI/2);
      await renderer.update(React.createElement(WalkCameraController,{...props,floor:building.floors[1],elevation:2.6}));
      await renderer.advanceFrames(10,1/60);
      assert.equal(camera.position.y,4.12);
      assert.equal(poseRef.current.z,3);
      const before={...poseRef.current};
      assert.equal(navigation.current.teleport({...landing,x:100},{yaw:0,pitch:0}),false);
      assert.deepEqual(poseRef.current,before);
    } finally {await renderer.unmount();}
    assert.equal(navigation.current,null);
  });

  test('unpaired portal meshes are procedural toon geometry, ignore gun raycasts and honor reduced motion',async()=>{
    const renderer=await create(React.createElement(PortalSurface,{anchor:anchor(),color:'blue',reducedMotion:true}));
    try {
      renderer.scene.instance.updateMatrixWorld(true);
      let meshes=0;
      renderer.scene.instance.traverse(object=>{if(object.isMesh){meshes++;assert.equal(object.material.type,'MeshToonMaterial');}});
      assert.ok(meshes>=6);
      const ray=new Raycaster(new Vector3(0,1.18,3),new Vector3(0,0,-1));
      assert.deepEqual(ray.intersectObjects(renderer.scene.instance.children,true),[]);
      const root=renderer.scene.findByProps({name:'gun-portal-blue'}).instance;
      const energy=root.children[0].children[0].children.at(-1);
      await renderer.advanceFrames(10,1/60); assert.equal(energy.rotation.z,0);
      await renderer.update(React.createElement(PortalSurface,{anchor:anchor(),color:'blue',reducedMotion:false}));
      await renderer.advanceFrames(10,1/60); assert.ok(energy.rotation.z>0);
    } finally {await renderer.unmount();}
  });

  test('portal creation grows from zero, overshoots and settles, replays on replacement, and respects reduced motion',async()=>{
    const first=anchor();
    const renderer=await create(React.createElement(PortalSurface,{anchor:first,color:'gold',reducedMotion:false}));
    try {
      const opening=renderer.scene.findByProps({name:'portal-opening'}).instance;
      const ripple=renderer.scene.findByProps({name:'portal-arrival-ripple'}).instance;
      assert.equal(opening.scale.x,0);
      await renderer.advanceFrames(1,.1);assert.ok(opening.scale.x>0 && opening.scale.x<1);
      await renderer.advanceFrames(3,.1);assert.ok(opening.scale.x>1);assert.equal(ripple.visible,true);
      await renderer.advanceFrames(5,.1);assert.equal(opening.scale.x,1);assert.equal(ripple.visible,false);
      await renderer.update(React.createElement(PortalSurface,{anchor:anchor(4),color:'gold',reducedMotion:false}));
      assert.equal(opening.scale.x,0);
      await renderer.update(React.createElement(PortalSurface,{anchor:first,color:'gold',reducedMotion:true}));
      assert.equal(opening.scale.x,1);await renderer.advanceFrames(1,.1);assert.equal(ripple.visible,false);
    } finally {await renderer.unmount();}
  });

  test('right-click and context menu are captured only during active pointer-locked desktop play and listeners clean up',async()=>{
    const dom=new JSDOM('<div id="root"></div>');
    const saved={window:globalThis.window,document:globalThis.document};
    Object.assign(globalThis,{window:dom.window,document:dom.window.document});
    let locked=null,calls=0; Object.defineProperty(document,'pointerLockElement',{get:()=>locked});
    const root=createRoot(document.getElementById('root'));
    function Probe({active}){usePortalInput(active,()=>calls++);return null;}
    const click=(button=2)=>{const event=new dom.window.MouseEvent('pointerdown',{button,cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;};
    const menu=()=>{const event=new dom.window.Event('contextmenu',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;};
    try {
      await act(async()=>root.render(React.createElement(Probe,{active:true})));
      assert.equal(click(),false); assert.equal(menu(),false);
      locked=document.getElementById('root');
      assert.equal(click(0),false); assert.equal(click(),true); assert.equal(menu(),true);assert.equal(calls,1);
      await act(async()=>root.render(React.createElement(Probe,{active:false})));
      assert.equal(click(),false); assert.equal(menu(),false);assert.equal(calls,1);
      await act(async()=>root.unmount()); assert.equal(click(),false);assert.equal(menu(),false);
    } finally {Object.assign(globalThis,saved);dom.window.close();}
  });
});

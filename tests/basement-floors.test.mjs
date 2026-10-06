import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Shape, ShapeGeometry } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const api = await load('/packages/engine/src/index.ts');
  const { makeStairProject, emptyExtensions, emptyRegistries } = await load('/tests/fixtures/multiple-floors.ts');
  const { ArchitectureScene } = await load('/packages/engine/src/ArchitectureScene.tsx');
  const { stableArchitectureModelRegistry } = await load('/packages/catalog/src/architecture/index.ts');
  const { topologyForDraft } = await load('/apps/web/src/editor-preview/construct/construct-controller-reducer.ts');
  const { cutStairGroundOpenings } = await load('/packages/engine/src/stairs/ground-apertures.ts');
  const { WalkCameraController } = await load('/packages/engine/src/WalkCameraController.tsx');
  const basementProject = () => {
    const project = makeStairProject();
    project.floors = project.floors.map((floor, i) => ({ ...floor, ...(i < 2 ? { belowGround: true } : {}) }));
    project.stairs.push({ ...project.stairs[0], id: 'upper-stairs', lowerFloorId: 'first', upperFloorId: 'second', at: [2,1.5] });
    return project;
  };
  test('basements grow downward while ground, upper elevations, and numbering remain stable', () => {
    const original = { project: makeStairProject(), bindings: {} };
    let snapshot = api.addBottomFloor(api.addBottomFloor(original, 'b1'), 'b2');
    assert.deepEqual(snapshot.project.floors.slice(0,2).map(f => f.name), ['Floor −2','Floor −1']);
    assert.deepEqual(api.deriveFloorLevels(snapshot.project.floors).map(f=>f.elevationMeters), [-5.2,-2.6,0,2.6,5.2]);
    snapshot = api.setFloorHeight(snapshot,'b1',3);
    assert.deepEqual(api.deriveFloorLevels(snapshot.project.floors).map(f=>Number(f.elevationMeters.toFixed(5))), [-5.6,-3,0,2.6,5.2]);
    assert.equal(api.addTopFloor(snapshot,'third').project.floors.at(-1).name,'Floor 3');
    assert.throws(()=>api.addBottomFloor(snapshot,'b1'),/unique/);
    assert.throws(()=>api.removeFloor(snapshot,'ground'),/ground floor/);
    assert.throws(()=>api.removeFloor(snapshot,'b1'),/lowest basement/);
    assert.throws(()=>api.removeFloor(snapshot,'first'),/top floor/);
    assert.deepEqual(api.removeFloor(api.removeFloor(snapshot,'b2'),'b1').project.floors, original.project.floors);
  });
  test('classification survives schema, serialization, topology and incomplete previews', () => {
    const project = basementProject();
    const validation = api.validateHomeProject(project,emptyRegistries);
    assert.equal(validation.valid,true,JSON.stringify(validation.issues));
    const fractional = { ...project, floors: project.floors.map((floor, index) => ({ ...floor, floorToFloorHeightMeters: index === 0 ? 2.6 : 3 })) };
    const fractionalPreview = api.composeHomeProjectPreview(fractional,emptyExtensions).manifest;
    assert.equal(api.deriveFloorLevels(fractionalPreview.floors).at(-1).elevationMeters,0);
    const parsed = api.parseHomeProject(api.serializeHomeProject(project));
    assert.equal(parsed.valid,true);
    assert.deepEqual(parsed.project,project);
    assert.equal(topologyForDraft(api.createFloorEditorDraft(project.floors[0])).floor.belowGround,true);
    project.floors[1].footprint=[];
    project.floors[2].footprint=[];
    const { manifest } = api.composeHomeProjectPreview(project,emptyExtensions);
    assert.equal(manifest.floors.length,1);
    assert.equal(api.deriveFloorLevels(manifest.floors)[0].elevationMeters,-5.2);
    for (const flags of [[false,true,false],[true,true,true],[true,'yes',false]]) {
      const invalid = basementProject();
      invalid.floors=invalid.floors.map((f,i)=>({...f,belowGround:flags[i]}));
      assert.equal(api.parseHomeProjectSchema(invalid).valid,false);
    }
  });
  test('basement deletion cleans references atomically and undo restores them', () => {
    const project = basementProject();
    const floor = project.floors[0];
    const roomId = floor.rooms[0].id;
    project.home.walkStart = { floorId: floor.id, at: [2,2], yawRadians: 0 };
    project.sceneItems = [{id:'sensor',floorId:floor.id,kind:'device',modelId:'thermometer',entitySlots:[{id:'sensor-slot'}]}];
    project.roomProfiles[roomId] = { dashboardSlots: [] };
    const profile = { schemaVersion:1, homeId:project.home.id, roomAreaIds:{[roomId]:'synthetic'},entityIdsBySlotId:{'sensor-slot':'sensor.synthetic'} };
    const initial = {project,bindings:{'https://synthetic.invalid':{draft:profile,published:profile,manualRoomIds:[roomId],manualSlotIds:['sensor-slot']}}};
    const removed = api.removeFloor(initial,floor.id);
    assert.equal(removed.project.home.walkStart,undefined);
    assert.equal(removed.project.sceneItems.length,0);
    assert.equal(removed.project.stairs.length,1);
    assert.equal(removed.project.roomProfiles[roomId],undefined);
    assert.deepEqual(removed.bindings['https://synthetic.invalid'].draft.entityIdsBySlotId,{});
    assert.deepEqual(removed.bindings['https://synthetic.invalid'].published,profile);
    const history=api.commitWorkspaceSnapshot(api.createWorkspaceHistory(initial),removed);
    assert.deepEqual(api.undoWorkspaceHistory(history).present,initial);
    assert.deepEqual(api.redoWorkspaceHistory(api.undoWorkspaceHistory(history)).present,removed);
    assert.equal(api.reconcileFloorSelection({activeFloorId:floor.id,wholeBuilding:false},project.floors.map(f=>f.id),removed.project.floors.map(f=>f.id)).activeFloorId,'first');
  });
  test('whole view hides basements; cutaway and Walk use negative elevations and fixed terrain', async () => {
    const manifest=api.composeHomeManifest(basementProject(),emptyExtensions);
    const props={manifest,floorView:'whole',activeFloorId:'second',interactionMode:'runtime',selectedRoomId:null,walkMode:false,
      wallFadeEnabled:false,reducedMotion:true,resolvedBindings:{rooms:{},openings:{}},architectureModels:stableArchitectureModelRegistry,deviceModels:{},openingPositions:{},onInteract(){}};
    const renderer=await create(createElement(ArchitectureScene,props));
    try {
      assert.equal(renderer.scene.findAll(node=>node.props.name?.startsWith('building-floor-')).length,1);
      const ground=renderer.scene.findByProps({name:'building-floor-second'}).instance;
      assert.equal(ground.position.y,0);
      assert.equal(renderer.scene.findAllByProps({name:'diorama-ground'}).length,1);
      await renderer.update(createElement(ArchitectureScene,{...props,floorView:'cutaway',activeFloorId:'first'}));
      assert.equal(renderer.scene.findAllByProps({name:'diorama-ground'}).length,0);
      assert.equal(renderer.scene.findAllByProps({name:'building-floor-second'}).length,0);
      assert.equal(renderer.scene.findByProps({name:'building-floor-first'}).instance.position.y,-2.6);
      await renderer.update(createElement(ArchitectureScene,{...props,walkMode:true,activeFloorId:'first'}));
      assert.equal(renderer.scene.findAll(node=>node.props.name?.startsWith('building-floor-')).length,3);
      assert.equal(renderer.scene.findByProps({name:'building-floor-ground'}).instance.position.y,-5.2);
      const incomplete = makeStairProject();
      incomplete.floors[0].footprint = [];
      const preview = api.composeHomeProjectPreview(incomplete,emptyExtensions).manifest;
      await renderer.update(createElement(ArchitectureScene,{...props,manifest:preview,activeFloorId:'first',floorView:'cutaway'}));
      assert.equal(renderer.scene.findAllByProps({name:'diorama-ground'}).length,0, 'omitted ground must not move terrain to the first complete upper floor');
    } finally { await renderer.unmount(); }
  });
  test('terrain aperture removes stair area while retaining existing holes', () => {
    const shape=new Shape();shape.moveTo(0,0);shape.lineTo(10,0);shape.lineTo(10,-10);shape.lineTo(0,-10);shape.closePath();
    const coordinates={origin:[0,0],metersPerPlanUnit:1,scaleBasis:'measured'};
    const cut=cutStairGroundOpenings([shape],coordinates,[[[2,2],[4,2],[4,4],[2,4]]]);
    const twice=cutStairGroundOpenings(cut,coordinates,[[[6,6],[8,6],[8,8],[6,8]]]);
    const geometry=new ShapeGeometry(twice);const p=geometry.attributes.position;const indices=geometry.index.array;
    let area=0;
    for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3);area+=Math.abs((p.getX(b)-p.getX(a))*(p.getY(c)-p.getY(a))-(p.getY(b)-p.getY(a))*(p.getX(c)-p.getX(a)))/2;}
    assert.equal(area,92);geometry.dispose();
  });
  for(const stairIndex of [0,1]) for(const ascending of [true,false]) test(`Walk crosses basement stair ${stairIndex} ${ascending?'up':'down'} without jumping`,async()=>{
    const building=basementProject();const stair=building.stairs[stairIndex];const flight=api.deriveStairFlight(building,stair);
    const startIndex=stairIndex+(ascending?0:1);const destinationIndex=stairIndex+(ascending?1:0);
    const levels=api.deriveFloorLevels(building.floors);
    const poseRef={current:{x:flight.startWorld[0],z:flight.startWorld[1]+(ascending?-.1:flight.runMeters+.1),yaw:0,pitch:0}};
    let requested;
    const props={floor:building.floors[startIndex],building,elevation:levels[startIndex].elevationMeters,poseRef,
      movementInputRef:{current:{x:0,y:ascending?1:-1}},lookInputRef:{current:{x:0,y:0}},lookDeltaRef:{current:{x:0,y:0}},reducedMotion:true,
      openingPositions:{},boundOpeningIds:new Set(),onOpeningsChange(){},onRoomChange(){},onFloorChange(id){requested=id;}};
    const renderer=await create(createElement(WalkCameraController,props));
    try {
      for(let i=0;i<300&&!requested;i++)await renderer.advanceFrames(1,1/60);
      assert.equal(requested,building.floors[destinationIndex].id);
      const camera=renderer.scene.findByType('PerspectiveCamera').instance;const y=camera.position.y;
      await renderer.update(createElement(WalkCameraController,{...props,floor:building.floors[destinationIndex],elevation:levels[destinationIndex].elevationMeters}));
      await renderer.advanceFrames(1,1/60);assert.ok(Math.abs(camera.position.y-y)<.05);
    }finally{await renderer.unmount();}
  });
});

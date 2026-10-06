import assert from 'node:assert/strict';
import test from 'node:test';
import { withModules } from './test-server.mjs';
await withModules(async load => {
  const api = await load('/packages/engine/src/stairs/index.ts');
  const { parseHomeProjectSchema } = await load('/packages/engine/src/home-project/validation.ts');
  const { makeStairProject } = await load('/tests/fixtures/multiple-floors.ts');
  const base = { id:'shaped', lowerFloorId:'ground', upperFloorId:'first', at:[3,2], rotationYRadians:0 };
  test('L-shaped flights end at a perpendicular exit and hold elevation across the landing', () => {
    for (const turn of ['left','right']) {
      const stair = {...base,shape:'l-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:3,turn};
      const project = {...makeStairProject(),stairs:[stair]};
      const flight = api.deriveStairFlight(project,stair);
      assert.ok(flight,'L-shaped stairs must derive');
      const end = flight.path.at(-1);
      assert.ok(Math.abs(end.x-(turn==='right'?6.5:-.5))<1e-8);
      assert.equal(end.z,4.5);
      const levelSegments = flight.path.slice(1).filter((p,i)=>p.elevation===flight.path[i].elevation);
      assert.ok(levelSegments.length>0,'landing must remain level');
      assert.equal(end.elevation,2.6);
    }
  });
  const { deriveStairGuardSegments } = await load('/packages/engine/src/stairs/guard-geometry.ts');
  test('U-shaped flights return parallel with a level landing and guard rails', () => {
    for (const turn of ['left','right']) {
      const stair={...base,shape:'u-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:3,turn};
      const project={...makeStairProject(),stairs:[stair]};
      const f=api.deriveStairFlight(project,stair);
      assert.ok(f);
      assert.equal(f.path.at(-1).x,turn==='right'?4:2);
      assert.equal(f.path.at(-1).z,1);
      assert.deepEqual(f.exitForward,[0,-1]);
      assert.equal(f.path[1].elevation,f.path[4].elevation);
      assert.ok(deriveStairGuardSegments(f,project.coordinates).length>0);
      assert.equal(api.deriveStairFlight(project,{...stair,upperRunMeters:0}),null);
    }
  });
  test('spiral diameter controls its circular aperture and total turn controls its exit', () => {
    const stair = {...base,shape:'spiral',diameterMeters:2,totalTurnDegrees:270,direction:'clockwise'};
    const project={...makeStairProject(),stairs:[stair]};
    const flight=api.deriveStairFlight(project,stair);
    assert.ok(flight,'spiral stairs must derive');
    assert.equal(flight.widthMeters,.9);
    assert.ok(Math.abs(flight.path.at(-1).x-3)<1e-8);
    assert.ok(Math.abs(flight.path.at(-1).z-1.45)<1e-8);
    const xs=flight.footprint.map(p=>p[0]);
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-2)<1e-8);
    assert.deepEqual(api.validateStairs(project),[]);
    assert.equal(api.deriveStairFlight(project,{...stair,diameterMeters:0}),null);
    assert.equal(api.deriveStairFlight(project,{...stair,totalTurnDegrees:361}),null);
  });
  test('schema round-trips new shapes and still accepts undiscriminated straight stairs', () => {
    const project=makeStairProject();
    for (const stair of [project.stairs[0], {...base,shape:'u-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:3,turn:'right'}, {...base,shape:'l-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:2,turn:'left'},
      {...base,shape:'spiral',diameterMeters:2,totalTurnDegrees:360,direction:'counterclockwise'}]) {
      const candidate={...project,stairs:[stair]};
      const parsed=parseHomeProjectSchema(JSON.parse(JSON.stringify(candidate)));
      assert.equal(parsed.valid,true,JSON.stringify(parsed.issues));
      assert.deepEqual(parsed.project.stairs,[stair]);
    }
    assert.equal(parseHomeProjectSchema({...project,stairs:[{...base,shape:'spiral',diameterMeters:2,totalTurnDegrees:270,direction:'up'}]}).valid,false);
  });
});
await withModules(async load => {
  const api=await load('/packages/engine/src/stairs/index.ts');
  const {makeStairProject}=await load('/tests/fixtures/multiple-floors.ts');
  const base={id:'shaped',lowerFloorId:'ground',upperFloorId:'first',at:[3,2],rotationYRadians:0};
  test('walks both shaped routes up and down without shortcutting the corner or spiral seam',()=>{
    for(const stair of [
      ...['left','right'].map(turn=>({...base,shape:'u-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:3,turn})),
      {...base,shape:'l-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:2,turn:'right'},
      ...['clockwise','counterclockwise'].flatMap(direction=>[270,360].map(totalTurnDegrees=>({...base,at:[4,4],shape:'spiral',diameterMeters:2,totalTurnDegrees,direction})))
    ]) {
      const project={...makeStairProject(),stairs:[stair]},f=api.deriveStairFlight(project,stair);
      const first=f.path[0],last=f.path.at(-1);
      const route=[{x:first.x-f.entranceForward[0]*.3,z:first.z-f.entranceForward[1]*.3},...f.path,
        {x:last.x+f.exitForward[0]*.3,z:last.z+f.exitForward[1]*.3}];
      let pose={...route[0],floorId:'ground',elevation:0};
      for(const points of [route,route.toReversed()]) {
        for(const target of points.slice(1)) {
          const from={...pose},n=Math.ceil(Math.hypot(target.x-from.x,target.z-from.z)/.025);
          for(let i=1;i<=n;i++) {
            const destination={x:from.x+(target.x-from.x)*i/n,z:from.z+(target.z-from.z)*i/n};
            const next=api.moveBuildingWalker(project,pose,{x:destination.x-pose.x,z:destination.z-pose.z},new Set());
            assert.ok(Math.abs(next.elevation-pose.elevation)<.15,`${stair.shape}: elevation jumped`);
            assert.ok(Math.hypot(next.x-destination.x,next.z-destination.z)<.001,`${stair.shape}: blocked on route ${JSON.stringify({pose,destination})}`);
            pose=next;
          }
        }
        assert.equal(pose.floorId,points===route?'first':'ground',JSON.stringify(stair));
        assert.equal(pose.stairId,undefined);
      }
    }
  });
  test('L-shaped obstruction checks follow the second flight, not the empty bounding rectangle',()=>{
    const stair={...base,shape:'l-shaped',widthMeters:1,lowerRunMeters:2,upperRunMeters:2,turn:'right'};
    const project={...makeStairProject(),stairs:[stair]};
    const wall={...project.floors[0].walls[0],id:'obstacle',from:[4.5,4],to:[4.5,5]};
    project.floors[0]={...project.floors[0],walls:[wall]};
    project.floors[1]={...project.floors[1],walls:[]};
    assert.ok(api.validateStairs(project).some(i=>i.code==='stair.obstruction'));
    project.floors[0]={...project.floors[0],walls:[{...wall,from:[4.5,2],to:[4.5,3]}]};
    assert.equal(api.validateStairs(project).some(i=>i.code==='stair.obstruction'),false);
  });
});
await withModules(async load=>{
 const {validateStairs}=await load('/packages/engine/src/stairs/index.ts');
 const {makeStairProject}=await load('/tests/fixtures/multiple-floors.ts');
 test('upper-floor furniture blocks a full spiral exit even where the lower route lies underneath',()=>{
   const stair={id:'spiral',lowerFloorId:'ground',upperFloorId:'first',at:[4,4],rotationYRadians:0,shape:'spiral',diameterMeters:2,totalTurnDegrees:360,direction:'clockwise'};
   for(const z of [4,4.2,4.8]) {
     const project={...makeStairProject(),stairs:[stair],sceneItems:[{id:'obstacle',kind:'furnishing',modelId:'obstacle',floorId:'first',size:[.3,1,.3],placement:{kind:'absolute',at:[4.55,z],elevationMeters:0,rotationYRadians:0}}]};
     assert.ok(validateStairs(project,{furnishingModels:{obstacle:{label:'Obstacle',defaultSize:[.3,1,.3],bounds:{min:[-.15,0,-.15],max:[.15,1,.15]}}}}).some(i=>i.code==='stair.item-obstruction'),`upper exit z=${z}`);
   }
 });
});
await withModules(async load=>{
 const {validateStairs}=await load('/packages/engine/src/stairs/index.ts');
 const {makeStairProject}=await load('/tests/fixtures/multiple-floors.ts');
 test('out-of-range spiral turns identify the field that needs correction',()=>{
   const project={...makeStairProject(),stairs:[{id:'s',lowerFloorId:'ground',upperFloorId:'first',at:[4,4],rotationYRadians:0,shape:'spiral',diameterMeters:2,totalTurnDegrees:361,direction:'clockwise'}]};
   assert.ok(validateStairs(project).some(i=>i.code==='stair.turn'));
 });
});

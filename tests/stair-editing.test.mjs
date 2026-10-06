import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { makeStairProject, emptyRegistries } = await load("/tests/fixtures/multiple-floors.ts");
  const { editStairFromPoint } = await load("/apps/web/src/editor-floors/stair-placement-geometry.ts");
  const { beginSegmentPress, segmentPressAnchors } = await load("/apps/web/src/editor-preview/construct/segment-gesture.ts");
  const { validateStairCandidate, canDraftStair, stairCandidateProject } = await load("/apps/web/src/editor-floors/stair-candidate-validation.ts");
  const { minimumStairRun } = await load("/packages/engine/src/stairs/stair-validation.ts");
  const { deriveStairFlight } = await load("/packages/engine/src/stairs/flight-geometry.ts");
  const { createSeedProjectRecord, serializeHomeProjectRecord, parseHomeProjectRecord } = await load("/packages/engine/src/home-project/project-record-codec.ts");
  const { publishHomeProject } = await load("/packages/engine/src/home-project/lifecycle.ts");
  const { validateHomeProject } = await load("/packages/engine/src/home-project/validation.ts");

  test("shared segment controller distinguishes anchoring jitter, drag, and subsequent click", () => {
    const press = beginSegmentPress(1, [100,100], [2,3], false);
    assert.equal(segmentPressAnchors(press,1,[104,102]),true);
    assert.equal(segmentPressAnchors(press,1,[108,100]),false);
    assert.equal(segmentPressAnchors(press,2,[100,100]),false);
    assert.equal(segmentPressAnchors(beginSegmentPress(1,[100,100],[2,3],true),1,[100,100]),false);
  });
  test("moving preserves grab offset, orientation, size and connections across coordinate scales", () => {
    for (const coordinates of [{origin:[0,0],metersPerPlanUnit:1},{origin:[17,-9],metersPerPlanUnit:.25}]) {
      const project = {...makeStairProject(), coordinates};
      const stair = {...project.stairs[0],rotationYRadians:.63};
      const flight = deriveStairFlight(project,stair);
      const start = {x:flight.startWorld[0],z:flight.startWorld[1]};
      const moved = editStairFromPoint(stair,coordinates,start,{x:3,z:5},{x:4.5,z:4},"body");
      const after = deriveStairFlight(project,moved);
      assert.ok(Math.abs(after.startWorld[0]-start.x-1.5)<1e-8);
      assert.ok(Math.abs(after.startWorld[1]-start.z+1)<1e-8);
      assert.deepEqual({...moved,at:stair.at},stair);
    }
  });
  test("endpoint edits preserve the opposite endpoint and width edits preserve centerline", () => {
    const project=makeStairProject(), stair=project.stairs[0], coordinates=project.coordinates;
    const start={x:4,z:1.5}, grab=start;
    const top=editStairFromPoint(stair,coordinates,start,grab,{x:4,z:4.5},"top");
    assert.equal(top.runMeters,3);
    assert.deepEqual(top.at,stair.at);
    const bottom=editStairFromPoint(stair,coordinates,start,grab,{x:3,z:2},"bottom");
    const flight=deriveStairFlight(project,bottom);
    assert.ok(Math.abs(flight.startWorld[0]+flight.forward[0]*flight.runMeters-4)<.005);
    assert.ok(Math.abs(flight.startWorld[1]+flight.forward[1]*flight.runMeters-5.5)<.005);
    for(const [handle,x] of [["left",3.8],["right",4.2]]) {
      const resized=editStairFromPoint(stair,coordinates,start,grab,{x,z:3},""+handle);
      assert.equal(resized.widthMeters,.4);
      assert.deepEqual(resized.at,stair.at);
      assert.equal(resized.runMeters,stair.runMeters);
    }
    assert.equal(editStairFromPoint(stair,coordinates,start,grab,start,"top"),null);
  });
  test("50 degree limit and 0.6 metre width apply to every candidate", () => {
    const project=makeStairProject(), stair=project.stairs[0];
    const run=minimumStairRun(2.6);
    assert.equal(validateStairCandidate(project,{...stair,runMeters:run}).some(i=>i.code==="stair.slope"),false);
    assert.equal(validateStairCandidate(project,{...stair,runMeters:run-.001}).some(i=>i.code==="stair.slope"),true);
    assert.equal(validateStairCandidate(project,{...stair,widthMeters:.6}).some(i=>i.code==="stair.width"),false);
    assert.equal(validateStairCandidate(project,{...stair,widthMeters:.59}).some(i=>i.code==="stair.width"),true);
    assert.equal(canDraftStair(project,{...stair,widthMeters:NaN}),false);
    assert.equal(canDraftStair(project,{...stair,runMeters:0}),false);
  });
  test("invalid stair edits survive record reload and remain blocking project issues", async () => {
    const project=makeStairProject();
    const record=createSeedProjectRecord(project);
    record.draft=stairCandidateProject(project,{...project.stairs[0],runMeters:1,widthMeters:.4});
    const parsed=parseHomeProjectRecord(serializeHomeProjectRecord(record),emptyRegistries);
    assert.ok(parsed.valid,JSON.stringify(parsed.issues));
    assert.equal(parsed.record.draft.stairs[0].runMeters,1);
    assert.deepEqual(parsed.record.published,project);
    assert.equal(validateHomeProject(parsed.record.draft,emptyRegistries).valid,false);
    const result = await publishHomeProject({validate: draft=>validateHomeProject(draft,emptyRegistries),
      replace: ()=>{throw new Error("invalid stairs must never publish");}},parsed.record);
    assert.equal(result.status,"blocked");
  });
  test("candidate diagnostics include overlaps regardless of original order and both floor obstructions", () => {
    const project=makeStairProject(), stair=project.stairs[0];
    project.stairs.push({...stair,id:"another"});
    assert.ok(validateStairCandidate(project,stair).some(i=>i.code==="stair.overlap"));
    for (const floorIndex of [0,1]) {
      const building=makeStairProject();
      building.floors=building.floors.map((floor,index)=> index!==floorIndex?floor:{...floor,walls:[...floor.walls,
        {...floor.walls[0],id:"blocking",from:[3,3],to:[5,3]}]});
      assert.ok(validateStairCandidate(building,stair).some(i=>i.code==="stair.obstruction"));
    }
  });
});

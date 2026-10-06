import assert from 'node:assert/strict';
import test from 'node:test';
import { withModules } from './test-server.mjs';

await withModules(async load => {
  const { makeThreeFloorProject } = await load('/tests/fixtures/multiple-floors.ts');
  const { createFloorEditorDraft } = await load('/packages/engine/src/home-editor/construct/create-floor-draft.ts');
  const { reduceDraft } = await load('/packages/engine/src/home-editor/construct/draft-reducer.ts');
  const { deriveFloorTopology } = await load('/packages/engine/src/home-editor/construct/topology.ts');
  const { repairDraftFloorIds } = await load('/packages/engine/src/home-project/repair-draft-floor-ids.ts');
  const { worldDragToSnappedConstructPlan } = await load('/apps/web/src/editor-preview/construct/drag-geometry.ts');
  const { parseHomeProjectRecord, createSeedProjectRecord, serializeHomeProjectRecord } = await load('/packages/engine/src/home-project/project-record-codec.ts');
  test('independently drawn rooms on three floors have distinct wall, room, junction and ceiling IDs', () => {
    const floors = makeThreeFloorProject().floors.map(floor => {
      let draft = { ...createFloorEditorDraft(floor), walls: [], rooms: [], openings: [], junctions: [], nextSerial: 1 };
      const corners = [[0,0],[4,0],[4,4],[0,4]];
      corners.forEach((from, index) => { draft = reduceDraft(draft, { type:'add-wall', from, to:corners[(index+1)%4] }); });
      const topology = deriveFloorTopology(draft);
      assert.ok(topology.floor);
      return topology.floor;
    });
    const ids = floors.flatMap(f => [...f.walls, ...f.rooms, ...f.wallJunctions, ...f.ceilings].map(x => x.id));
    assert.equal(new Set(ids).size, ids.length);
  });
  test('old duplicate floor IDs are repaired with architectural and item references intact', () => {
    const project = makeThreeFloorProject();
    const first = project.floors[0];
    const broken = { ...project, floors: [first, { ...structuredClone(first), id:'first' }, { ...structuredClone(first), id:'second' }],
      sceneItems: [{id:'upper-item',floorId:'second',placement:{kind:'ceiling',roomId:first.rooms[0].id}}] };
    const repaired = repairDraftFloorIds(broken);
    assert.equal(repaired.floors[0], first);
    assert.equal(repaired.sceneItems[0].placement.roomId, repaired.floors[2].rooms[0].id);
    const ids = repaired.floors.flatMap(f => [...f.walls,...f.rooms,...f.ceilings,...f.openings,...f.wallJunctions].map(x=>x.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const floor of repaired.floors) {
      const wallIds = new Set(floor.walls.map(w=>w.id));
      assert.ok(floor.openings.every(o=>wallIds.has(o.wallId)));
      assert.ok(floor.wallJunctions.every(j=>j.wallIds.every(id=>wallIds.has(id))));
      assert.ok(floor.ceilings.every(c=>c.roomIds.every(id=>floor.rooms.some(r=>r.id===id))));
    }
    assert.equal(repairDraftFloorIds(repaired), repaired, 'repair is idempotent');
    assert.equal(broken.floors[2].rooms[0].id, first.rooms[0].id, 'input is not mutated');
  });
  test('loading an existing draft repairs duplicate IDs without altering the published home', () => {
    const project = makeThreeFloorProject();
    const record = createSeedProjectRecord(project);
    record.draft = { ...project, floors: [project.floors[0], { ...structuredClone(project.floors[0]), id:'first' }] };
    const parsed = parseHomeProjectRecord(serializeHomeProjectRecord(record), {furnishingModels:{},deviceModels:{}});
    assert.ok(parsed.valid, JSON.stringify(parsed.issues));
    assert.notEqual(parsed.record.draft.floors[0].rooms[0].id, parsed.record.draft.floors[1].rooms[0].id);
    assert.deepEqual(parsed.record.published, record.published);
    assert.deepEqual(parsed.record.bindings, record.bindings);
  });
  test('lower-floor walls supply endpoint and segment snaps, with Alt bypass', () => {
    const args = {coordinates:{origin:[0,0],metersPerPlanUnit:1},walls:[{id:'below',from:[2,2],to:[6,2]}],pixelsPerMeter:100};
    assert.deepEqual(worldDragToSnappedConstructPlan({...args,point:{x:2.04,z:2.03}}),[2,2]);
    assert.deepEqual(worldDragToSnappedConstructPlan({...args,point:{x:4,z:2.04}}),[4,2]);
    assert.deepEqual(worldDragToSnappedConstructPlan({...args,point:{x:2.04,z:2.03},absolute:true}),[2.04,2.03]);
  });
});

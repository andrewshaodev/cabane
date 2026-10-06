import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const engine = await load("/packages/engine/src/index.ts");
  const { parseHomeProjectSchema } = await load("/packages/engine/src/home-project/validation.ts");
  const { ownerProjectRegistries } = await load("/apps/web/src/project-runtime.ts");
  const { reconcileBuildTutorial, roomHasOpening } = await load("/apps/web/src/editor-onboarding/build-tutorial-progress.ts");
  const { enrollBuildTutorial, readBuildTutorial, writeBuildTutorial, forgetBuildTutorial } = await load("/apps/web/src/editor-onboarding/build-tutorial-storage.ts");
  const { collectConstructContextualIssues, visibleConstructIssues } = await load("/apps/web/src/editor-preview/construct/contextual-validation.ts");
  const blank = () => engine.createEmptyHomeProject("test", "Test");
  const walls = [
    { id: "north", from: [0, 0], to: [6, 0] }, { id: "east", from: [6, 0], to: [6, 4] },
    { id: "south", from: [6, 4], to: [0, 4] }, { id: "west", from: [0, 4], to: [0, 0] },
  ];
  const roomProject = () => {
    const project = blank();
    const topology = engine.deriveFloorTopology({ ...engine.createFloorEditorDraft(project.floors[0]), walls });
    project.floors[0] = { ...topology.floor, floorToFloorHeightMeters: 2.8 };
    return project;
  };
  const addOpening = (project, kind, wallId = "north") => {
    const floor = project.floors[0];
    floor.openings.push({ id: kind, kind, wallId, offsetFromWallStartPlanUnits: kind === "door" ? 1 : 3,
      widthPlanUnits: 1, openingHeightMeters: kind === "door" ? 2.1 : 1.2, sillHeightMeters: kind === "door" ? 0 : .8,
      ...(kind === "door" ? { operation: "hinged", variant: "panel", leafCount: 1, finish: "wood" }
        : { operation: "fixed", variant: "plain", panelCount: 1, glazing: "clear" }) });
    return project;
  };
  const named = () => {
    const project = addOpening(addOpening(roomProject(), "door"), "window");
    project.floors[0].rooms[0].name = "Studio";
    return project;
  };

  test("blank floor has exactly the two expected diagnostics; presentation alone suppresses them", () => {
    const project = blank(), floor = project.floors[0];
    const issues = collectConstructContextualIssues({ floor,
      topologyIssues: engine.deriveFloorTopology(engine.createFloorEditorDraft(floor)).issues,
      projectIssues: engine.validateHomeProject(project, ownerProjectRegistries).issues,
      navigationIssues: engine.evaluateDerivedWalkNavigation(floor).diagnostics });
    assert.deepEqual(issues.map(issue => issue.code).sort(), ["project.floor-empty", "topology.walls-required"]);
    const context = { floor, floorIndex: 0, hasItems: false };
    for (const tool of ["select", "wall", "door", "window"]) assert.deepEqual(visibleConstructIssues(issues, tool, context), []);
    assert.equal(engine.validateHomeProject(project, ownerProjectRegistries).valid, false);
    assert.equal(visibleConstructIssues(issues, null, context).length, 2);
    const unrelated = { code: "navigation.room-no-safe-spawn", source: "navigation", severity: "error", path: "rooms[0]" };
    assert.deepEqual(visibleConstructIssues([...issues, unrelated], "select", context), [unrelated]);
    assert.equal(visibleConstructIssues(issues, "select", { ...context, hasItems: true }).length, 2);
    assert.equal(visibleConstructIssues(issues, "select", { ...context, floorIndex: 1 }).length, 1, "another floor's error remains visible");
  });

  test("unnamed rooms can autosave and reload but cannot publish", async () => {
    const project = roomProject();
    assert.equal(parseHomeProjectSchema(project).valid, true);
    const validation = engine.validateHomeProject(project, ownerProjectRegistries);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some(issue => issue.code === "room.name"));
    const record = engine.createSeedProjectRecord(blank()); record.publishedAt = 0;
    const repository = { replace: async next => {
      const parsed = engine.parseHomeProjectRecord(engine.serializeHomeProjectRecord(next), ownerProjectRegistries);
      assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
      return parsed.record;
    }};
    const saved = await engine.autosaveHomeProjectDraft(repository, record, project);
    assert.equal(saved.status, "saved");
    assert.equal(saved.record.draft.floors[0].rooms[0].name, "");
    project.floors[0].rooms[0].name = 42;
    assert.equal(parseHomeProjectSchema(project).valid, false, "wrong types remain invalid");
  });

  test("objectives follow real architecture and remember the first room", () => {
    let state = engine.createBuildTutorialState();
    assert.equal(reconcileBuildTutorial(state, blank(), "construct").step, "reference");
    assert.equal(reconcileBuildTutorial(state, blank(), "construct", true).step, "walls");
    assert.equal(reconcileBuildTutorial({ ...state, skipped: ["reference"] }, blank(), "construct").step, "walls");
    assert.equal(reconcileBuildTutorial({ ...state, step: "walls" }, blank(), "construct").step, "walls", "existing tutorials do not rewind to the optional step");
    const project = roomProject();
    state = reconcileBuildTutorial(state, project, "construct");
    assert.equal(state.step, "door");
    assert.deepEqual(state.target, { floorId: project.floors[0].id, roomId: project.floors[0].rooms[0].id });
    state = reconcileBuildTutorial(state, addOpening(project, "door"), "construct");
    assert.equal(state.step, "window");
    state = reconcileBuildTutorial(state, addOpening(project, "window"), "construct");
    assert.equal(state.step, "name");
    project.floors[0].rooms[0].name = "  Studio  ";
    state = reconcileBuildTutorial(state, project, "furnish");
    assert.equal(state.step, "arrange");
    state = reconcileBuildTutorial({ ...state, readyToConnect: true }, project, "furnish");
    assert.equal(state.step, "connect");
    assert.equal(project.sceneItems.length, 0, "furniture is optional");
    assert.equal(reconcileBuildTutorial(state, project, "connect").status, "completed");
  });

  test("out-of-order actions, skipped steps, undo, redo, and deleted targets reconcile", () => {
    const project = named();
    let state = reconcileBuildTutorial(engine.createBuildTutorialState(), project, "construct");
    assert.equal(state.step, "arrange");
    const withoutDoor = structuredClone(project); withoutDoor.floors[0].openings = withoutDoor.floors[0].openings.filter(o => o.kind !== "door");
    assert.equal(reconcileBuildTutorial(state, withoutDoor, "construct").step, "door");
    assert.equal(reconcileBuildTutorial(state, project, "construct").step, "arrange");
    assert.equal(reconcileBuildTutorial({ ...state, skipped: ["door"] }, withoutDoor, "construct").step, "arrange");
    const removed = reconcileBuildTutorial(state, blank(), "construct");
    assert.equal(removed.step, "walls"); assert.equal(removed.target, undefined);
    const replacement = named(); replacement.floors[0].rooms[0].id = "replacement";
    assert.equal(reconcileBuildTutorial(state, replacement, "construct").target.roomId, "replacement");
    assert.equal(reconcileBuildTutorial({ ...state, skipped: ["arrange", "connect"] }, project, "construct").status, "completed");
    const dismissed = { ...state, status: "dismissed" };
    assert.equal(reconcileBuildTutorial(dismissed, blank(), "construct"), dismissed);
  });

  test("an opening elsewhere in a long wall does not satisfy the target room", () => {
    const project = addOpening(roomProject(), "door"); const floor = project.floors[0];
    floor.walls.find(wall => wall.id === "north").to = [15, 0];
    floor.openings[0].offsetFromWallStartPlanUnits = 10;
    assert.equal(roomHasOpening(floor, floor.rooms[0], "door"), false);
    floor.openings[0].offsetFromWallStartPlanUnits = 1;
    assert.equal(roomHasOpening(floor, floor.rooms[0], "door"), true);
  });

  test("setup state is optional, per-home, durable, and keeps dismissal across reload", () => {
    const previous = globalThis.window;
    const values = new Map(); const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    globalThis.window = { localStorage: storage };
    try {
      assert.equal(readBuildTutorial("existing").state, undefined);
      assert.equal(enrollBuildTutorial("new-a"), true);
      assert.equal(readBuildTutorial("new-a").state.status, "active");
      assert.equal(readBuildTutorial("new-b").state, undefined);
      const dismissed = { ...readBuildTutorial("new-a").state, status: "dismissed", step: "window", skipped: ["door"] };
      writeBuildTutorial("new-a", dismissed); forgetBuildTutorial("new-a");
      assert.deepEqual(readBuildTutorial("new-a").state, dismissed);
      enrollBuildTutorial("new-a"); assert.equal(readBuildTutorial("new-a").state.status, "dismissed", "resuming Build does not reenroll");
      writeBuildTutorial("new-a", engine.createBuildTutorialState());
      assert.equal(readBuildTutorial("new-a").state.status, "active");
      const record = engine.createSetupRecord(); record.buildTutorial = { status: "invalid" };
      engine.saveSetupRecord(storage, "malformed", record);
      assert.equal(engine.loadSetupRecord(storage, "malformed").record.buildTutorial, undefined);
      assert.equal(engine.loadSetupRecord(storage, "malformed").record.activated, false);
    } finally { for (const id of ["existing", "new-a", "new-b", "malformed"]) forgetBuildTutorial(id); globalThis.window = previous; }
  });

  test("storage failure retains enrollment and dismissal in the session", () => {
    const previous = globalThis.window;
    globalThis.window = { get localStorage() { throw new Error("unavailable"); } };
    try {
      assert.equal(enrollBuildTutorial("unavailable"), false);
      const state = readBuildTutorial("unavailable");
      assert.equal(state.state.status, "active"); assert.equal(state.durable, false);
      writeBuildTutorial("unavailable", { ...state.state, status: "dismissed" });
      assert.equal(readBuildTutorial("unavailable").state.status, "dismissed");
    } finally { forgetBuildTutorial("unavailable"); globalThis.window = previous; }
  });
});

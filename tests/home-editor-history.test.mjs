import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    applyProjectValuePatches,
    commitProjectCommand,
    createProjectHistory,
    redoProjectHistory,
    undoProjectHistory,
  } = await load("/packages/engine/src/home-editor/index.ts");
  const engineApi = await load("/packages/engine/src/index.ts");

  const fixtureProject = () => ({
    schemaVersion: 1,
    seedRevision: "fixture-v1",
    home: {
      id: "fixture-home",
      name: "Fixture home",
      locale: "en",
      palette: {
        accent: "#d48a54",
        secondary: "#758f83",
        exterior: "#c97370",
        interior: "#e4e0d8",
        ground: "#91a06a",
      },
    },
    floor: {
      id: "ground-floor",
      name: "Ground floor",
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      defaultWallHeightMeters: 2.4,
      defaultCeilingHeightMeters: 2.4,
      footprint: [
        [0, 0],
        [4, 0],
        [4, 3],
        [0, 3],
      ],
      rooms: [],
      walls: [],
      wallJunctions: [],
      openings: [],
      ceilings: [],
    },
    sceneItems: [
      {
        id: "chair",
        kind: "furnishing",
        modelId: "chair",
        placement: {
          kind: "absolute",
          at: [1, 1],
          elevationMeters: 0,
          rotationYRadians: 0,
        },
        size: [0.6, 0.9, 0.6],
      },
    ],
    roomProfiles: {},
    openingProfiles: {},
    shortcuts: [],
    assumptions: [],
  });

  const command = (id, domain, path, before, after) => ({
    id,
    label: id,
    domain,
    before: [{ path, value: before }],
    after: [{ path, value: after }],
  });

  test("exports project history through the engine public API", () => {
    assert.equal(engineApi.createProjectHistory, createProjectHistory);
  });

  test("records semantic edits from both modes in one history", () => {
    let history = createProjectHistory(fixtureProject());
    history = commitProjectCommand(
      history,
      command("rename-floor", "construct", ["floor", "name"], "Ground floor", "Main floor"),
    );
    history = commitProjectCommand(
      history,
      command("move-chair", "furnish", ["sceneItems", 0, "placement", "at"], [1, 1], [2, 1.5]),
    );

    assert.equal(history.undo.length, 2);
    assert.deepEqual(history.present.sceneItems[0].placement.at, [2, 1.5]);
    history = undoProjectHistory(history);
    assert.equal(history.present.floor.name, "Main floor");
    assert.deepEqual(history.present.sceneItems[0].placement.at, [1, 1]);
    history = undoProjectHistory(history);
    assert.equal(history.present.floor.name, "Ground floor");
  });

  test("redo is stable and a new semantic command clears the redo stack", () => {
    const initial = fixtureProject();
    const rename = command(
      "rename-floor",
      "construct",
      ["floor", "name"],
      "Ground floor",
      "Main floor",
    );
    let history = commitProjectCommand(createProjectHistory(initial), rename);
    const committed = history.present;

    history = undoProjectHistory(history);
    assert.equal(history.redo.length, 1);
    history = redoProjectHistory(history);
    assert.deepEqual(history.present, committed);
    assert.equal(history.redo.length, 0);

    history = undoProjectHistory(history);
    history = commitProjectCommand(
      history,
      command("rename-home", "project", ["home", "name"], "Fixture home", "My home"),
    );
    assert.equal(history.redo.length, 0);
  });

  test("caps history at the configured limit", () => {
    let history = createProjectHistory(fixtureProject(), 3);
    for (let index = 0; index < 5; index += 1) {
      const before = `Floor ${index}`;
      if (index === 0)
        history = commitProjectCommand(
          history,
          command("rename-0", "construct", ["floor", "name"], "Ground floor", before),
        );
      history = commitProjectCommand(
        history,
        command(
          `rename-${index + 1}`,
          "construct",
          ["floor", "name"],
          before,
          `Floor ${index + 1}`,
        ),
      );
    }
    assert.equal(history.undo.length, 3);
    history = undoProjectHistory(undoProjectHistory(undoProjectHistory(history)));
    assert.equal(history.present.floor.name, "Floor 2");
  });

  test("rejects duplicate, overlapping, unsafe, mismatched, and stale paths", () => {
    const history = createProjectHistory(fixtureProject());
    const duplicate = {
      id: "duplicate",
      label: "Duplicate",
      domain: "project",
      before: [
        { path: ["home", "name"], value: "Fixture home" },
        { path: ["home", "name"], value: "Fixture home" },
      ],
      after: [
        { path: ["home", "name"], value: "A" },
        { path: ["home", "name"], value: "B" },
      ],
    };
    assert.throws(() => commitProjectCommand(history, duplicate), /duplicate path/);

    const overlapping = {
      id: "overlap",
      label: "Overlap",
      domain: "project",
      before: [
        { path: ["home"], value: history.present.home },
        { path: ["home", "name"], value: "Fixture home" },
      ],
      after: [
        { path: ["home"], value: history.present.home },
        { path: ["home", "name"], value: "Other" },
      ],
    };
    assert.throws(() => commitProjectCommand(history, overlapping), /overlapping paths/);
    assert.throws(
      () =>
        commitProjectCommand(
          history,
          command("unsafe", "project", ["__proto__", "polluted"], undefined, true),
        ),
      /invalid path/,
    );
    assert.throws(
      () =>
        commitProjectCommand(history, {
          id: "mismatch",
          label: "Mismatch",
          domain: "project",
          before: [{ path: ["home", "name"], value: "Fixture home" }],
          after: [{ path: ["floor", "name"], value: "Other" }],
        }),
      /same paths/,
    );
    assert.throws(
      () =>
        commitProjectCommand(
          history,
          command("stale", "project", ["home", "name"], "Stale home", "Other"),
        ),
      /does not match/,
    );
  });

  test("applies multiple patches immutably and ignores no-op commands", () => {
    const project = fixtureProject();
    const changed = applyProjectValuePatches(project, [
      { path: ["home", "name"], value: "My home" },
      { path: ["floor", "name"], value: "Main floor" },
    ]);
    assert.equal(project.home.name, "Fixture home");
    assert.equal(changed.home.name, "My home");
    assert.equal(changed.floor.name, "Main floor");
    assert.notEqual(changed, project);
    assert.notEqual(changed.home, project.home);
    assert.notEqual(changed.floor, project.floor);
    assert.equal(changed.sceneItems, project.sceneItems);

    const history = createProjectHistory(project);
    assert.equal(
      commitProjectCommand(
        history,
        command("noop", "project", ["home", "name"], "Fixture home", "Fixture home"),
      ),
      history,
    );
    assert.equal(undoProjectHistory(history), history);
    assert.equal(redoProjectHistory(history), history);
  });
});

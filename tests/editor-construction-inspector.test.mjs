import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { ConstructionInspector } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionInspector.tsx",
  );
  const { FloorPaintConfirmation } = await load(
    "/apps/web/src/editor-preview/construct/FloorPaintConfirmation.tsx",
  );

  const { useConstructEditor } = await load("/apps/web/src/editor-preview/construct/useConstructEditor.ts");
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const { OpeningDetails } = await load("/apps/web/src/editor-preview/construct/OpeningDetails.tsx");
  const { OpeningOrientationControls } = await load("/apps/web/src/editor-preview/construct/OpeningOrientationControls.tsx");
  const { SelectedOpeningActionBar } = await load("/apps/web/src/editor-preview/construct/SelectedOpeningControls.tsx");

  const wall = { id: "living-east", from: [0, 0], to: [4.25, 0] };
  const opening = {
    id: "living-window",
    kind: "window",
    operation: "casement", variant: "plain", panelCount: 1, glazing: "clear",
    wallId: wall.id,
    offsetPlanUnits: 1.2,
    widthPlanUnits: 1.4,
    openingHeightMeters: 1.2,
    sillHeightMeters: .8,
  };
  const editor = (selection, actions = {}) => ({
    previewFloor: {
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      rooms: Array.from({ length: 3 }),
      walls: [{ ...wall, classification: "exterior", thicknessMeters: .2 }],
    },
    draft: {
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      walls: [wall, { id: "living-south", from: [4.25, 0], to: [4.25, 3] }],
      openings: [opening],
      rooms: [],
      defaultWallHeightMeters: 2.5,
      defaultCeilingHeightMeters: 2.5,
      exteriorWallThicknessMeters: .2,
      interiorWallThicknessMeters: .12,
    },
    selection,
    tool: "select",
    wallRuns: [],
    exteriorWallColor: "#c97370",
    defaultExteriorWallColor: "#c97370",
    canUndo: true,
    canRedo: false,
    topologyIssues: actions.topologyIssues ?? [],
    setTool: actions.setTool ?? (() => undefined),
    undo: () => undefined,
    redo: () => undefined,
    selectWall: actions.selectWall ?? (() => undefined),
    selectOpening: actions.selectOpening ?? (() => undefined),
    selectRoom: actions.selectRoom ?? (() => undefined),
    setExteriorWallColor: actions.setExteriorWallColor ?? (() => undefined),
    updateWallEndpoint: () => undefined,
    updateSelectedWallMetadata: actions.updateSelectedWallMetadata ?? (() => undefined),
    addOpening: actions.addOpening ?? (() => undefined),
    updateSelectedOpening: () => undefined,
    deleteSelected: actions.deleteSelected ?? (() => undefined),
  });

  const withDom = async (run) => {
    const dom = new JSDOM("<!doctype html><div id=\"root\"></div>", {
      url: "http://cabane.local/",
    });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      HTMLElement: globalThis.HTMLElement,
      Event: globalThis.Event,
      actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      HTMLElement: dom.window.HTMLElement,
      Event: dom.window.Event,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    dom.window.HTMLCanvasElement.prototype.getContext = function getContext() {
      return new Proxy({ canvas: this }, {
        set(target, property, value) {
          target[property] = value;
          return true;
        },
        get(target, property) {
          if (property in target) return target[property];
          return () => undefined;
        },
      });
    };
    const root = createRoot(dom.window.document.getElementById("root"));
    try {
      await run({ dom, root });
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, {
        window: previous.window,
        document: previous.document,
        navigator: previous.navigator,
        HTMLElement: previous.HTMLElement,
        Event: previous.Event,
        IS_REACT_ACT_ENVIRONMENT: previous.actEnvironment,
      });
    }
  };

  test("keeps wall properties simple and moves tools out of the inspector", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor({ kind: "wall", id: wall.id }),
      })));

      const document = dom.window.document;
      assert.match(document.body.textContent, /Selected wall/);
      assert.match(document.body.textContent, /4\.25 m/);
      assert.doesNotMatch(document.body.textContent, /Choose what to place|Place door|Place window|Place passage/);
      assert.doesNotMatch(document.body.textContent, /Structure data/);
      assert.equal(document.querySelector("[aria-label='from X coordinate']"), null);

      assert.ok(document.querySelector('[aria-label="Wall thickness"]'));
      assert.ok(document.querySelector('[aria-label="Wall height"]'));
      assert.equal(document.querySelector('[aria-label="Construction tools"]'), null);
      assert.equal(document.querySelector('[aria-label="Construction history"]'), null);
      assert.equal(document.querySelector('.construction-inspector__counts'), null);
    });
  });

  test("edits an exterior wall color and keeps the same value in the wall tool", async (context) => {
    context.mock.timers.enable({ apis: ["setTimeout"] });
    const calls = [];
    const controller = editor({ kind: "wall", id: wall.id }, {
      setExteriorWallColor: (color) => calls.push(["remember", color]),
      updateSelectedWallMetadata: (changes) => calls.push(["wall", changes]),
    });
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: controller,
      })));
      const selectedColor = dom.window.document.querySelector('[aria-label="Wall exterior color"]');
      assert.equal(selectedColor.value, "#c97370");
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")
        .set.call(selectedColor, "#b86f58");
      await act(async () => {
        selectedColor.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        context.mock.timers.tick(180);
      });
      assert.deepEqual(calls, [
        ["remember", "#b86f58"],
        ["wall", { exteriorColor: "#b86f58" }],
      ]);
      calls.length = 0;

      controller.tool = "wall";
      controller.exteriorWallColor = "#b86f58";
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: controller,
      })));
      const drawingColor = dom.window.document.querySelector('[aria-label="New wall exterior color"]');
      assert.equal(drawingColor.value, "#b86f58");
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")
        .set.call(drawingColor, "#9b5e4b");
      await act(async () => {
        drawingColor.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        context.mock.timers.tick(180);
      });
      assert.deepEqual(calls, [
        ["remember", "#9b5e4b"],
        ["wall", { exteriorColor: "#9b5e4b" }],
      ]);
    });
  });

  test("Floor tool offers finish and custom-area controls", async () => {
    const calls = [];
    const controller = editor(null);
    controller.tool = "floor";
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(
        ConstructionInspector,
        {
          editor: controller,
          floorPainting: {
            finish: { kind: "preset", preset: "travertine" },
            target: "room",
            drawingActive: false,
            drawingError: null,
            onFinishChange: (finish) => calls.push(["finish", finish]),
            onTargetChange: (target) => calls.push(["target", target]),
            onCancelDrawing: () => calls.push(["cancel"]),
          },
        },
      )));
      const document = dom.window.document;
      assert.ok(document.querySelector('[aria-label="Light oak 2"]'));
      assert.ok(document.querySelector('[aria-label="Sand"]'));
      assert.ok(document.querySelector('[aria-label="Gravel"]'));
      assert.equal(
        document.querySelector('[aria-label="Travertine"]')
          .getAttribute("aria-pressed"),
        "true",
      );
      await act(async () =>
        document.querySelector('[aria-label="Custom area"]').click()
      );
      assert.deepEqual(calls.at(-1), ["target", "custom-area"]);
    });
  });

  test("whole-room confirmation focuses Keep and exposes all three outcomes", async () => {
    const calls = [];
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(
        FloorPaintConfirmation,
        {
          roomName: "Kitchen",
          onKeepZones: () => calls.push("keep"),
          onReplaceEverything: () => calls.push("replace"),
          onCancel: () => calls.push("cancel"),
        },
      )));
      const buttons = [...dom.window.document.querySelectorAll("dialog button")];
      assert.deepEqual(buttons.map((button) => button.textContent), [
        "Keep custom areas",
        "Replace everything",
        "Cancel",
      ]);
      assert.equal(dom.window.document.activeElement, buttons[0]);
      await act(async () => buttons[1].click());
      await act(async () => buttons[2].click());
      assert.deepEqual(calls, ["replace", "cancel"]);
    });
  });

  test("teaches Shift-drag marquee selection while Select is idle", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null),
        planImportControls: React.createElement("section", { "aria-label": "Build from a floor plan" }, "Have a floor plan?"),
      })));
      assert.match(dom.window.document.body.textContent, /Hold Shift and drag to select several/);
      assert.match(dom.window.document.body.textContent, /Delete or Backspace/);
      assert.ok(dom.window.document.body.textContent.indexOf("Edit the plan") < dom.window.document.body.textContent.indexOf("Have a floor plan?"));
    });
  });

  test("labels the selected room's usable interior area instead of its wall-centerline area", async () => {
    const polygon = [[0, 0], [4, 0], [4, 3], [0, 3]];
    const room = { id: "bedroom", name: "Bedroom", polygon, accent: "#c98164" };
    const state = editor({ kind: "room", id: room.id });
    state.draft.rooms = [{ ...room, anchor: [2, 1.5] }];
    state.previewFloor = {
      ...state.previewFloor, footprint: polygon, rooms: [room], wallJunctions: [],
      walls: polygon.map((from, index) => ({
        id: `wall-${index}`, from, to: polygon[(index + 1) % polygon.length],
        thicknessMeters: .2, classification: "exterior",
      })),
    };
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, { editor: state })));
      const area = dom.window.document.querySelector('[title="Interior floor area"]');
      assert.equal(area.textContent, "10.6 m²");
      assert.equal(area.getAttribute("aria-label"), "Interior floor area: 10.6 square meters");
      assert.equal([...dom.window.document.querySelectorAll("button")].some((button) => button.textContent === "Delete room"), true);
    });
  });

  test("summarizes effective multiple-selection targets and deletes them from one action", async () => {
    let deletions = 0;
    const controller = editor({ kind: "multiple", targets: [
      { kind: "room", id: "bedroom" },
      { kind: "pool", id: "pool" },
    ] }, { deleteSelected: () => deletions++ });
    controller.deletionTargets = [
      { kind: "room", id: "bedroom" },
      { kind: "wall", id: "north" },
      { kind: "wall", id: "divider" },
      { kind: "opening", id: "door" },
      { kind: "pool", id: "pool" },
    ];
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, { editor: controller })));
      const document = dom.window.document;
      assert.match(document.body.textContent, /5 elements selected/);
      assert.match(document.body.textContent, /Rooms1/);
      assert.match(document.body.textContent, /Walls2/);
      assert.match(document.body.textContent, /Openings1/);
      assert.match(document.body.textContent, /Pools1/);
      assert.equal(document.querySelector('[aria-label="Wall thickness"]'), null);
      const remove = [...document.querySelectorAll("button")].find((button) => button.textContent === "Delete selection");
      await act(async () => remove.click());
      assert.equal(deletions, 1);
    });
  });

  test("keeps scale and heights available without the removed Advanced controls", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor({ kind: "wall", id: wall.id }),
        onRoofChange: () => {},
      })));
      const document = dom.window.document;
      assert.equal(document.querySelector(".construction-inspector__expert-toggle"), null);
      assert.equal(document.querySelector('[aria-label="Expert construction data"]'), null);
      assert.equal(document.querySelector('[aria-label="from X coordinate"]'), null);
      const sections = [...document.querySelectorAll('details.construction-inspector__floor-disclosure')];
      assert.deepEqual(sections.map(section => section.querySelector('.sidebar-section-summary__copy > span').textContent), ['Roof', 'Scale & heights']);
      const floorSettings = sections[1];
      assert.equal(floorSettings.open, false);
      assert.ok(floorSettings.querySelector('[aria-label="Meters per plan unit"]'));
      assert.ok(floorSettings.querySelector('[aria-label="Default wall height"]'));
      assert.ok(floorSettings.querySelector('summary small').textContent);
      assert.equal(floorSettings.querySelectorAll('summary svg').length, 2);
    });
  });

  test("window properties move from the sidebar into floating Details", async () => {
    await withDom(async ({ dom, root }) => {
      const controller = editor({ kind: "opening", id: opening.id });
      await act(async () => root.render(React.createElement(ConstructionInspector, { editor: controller })));
      assert.equal(dom.window.document.querySelector('[aria-label="Opening width"]'), null);
      assert.ok(dom.window.document.querySelector('.construction-inspector__floor-disclosure'));
      const changes = [];
      let closed = 0;
      await act(async () => root.render(React.createElement(OpeningDetails, {
        opening, editor: { ...controller, dispatch: (action) => changes.push(action) },
        disabled: false, onClose: () => closed++,
      })));
      const document = dom.window.document;
      assert.ok(document.querySelector('.selection-details[data-mode="construct"]'));
      assert.ok(document.querySelector('[aria-label="Opening width"]'));
      assert.ok(document.querySelector('[aria-label="Window height from floor"]'));
      assert.equal(document.querySelector('.opening-properties__advanced').open, false);
      assert.ok(document.querySelector('[role="img"][aria-label="Window opening direction in plan view"]'));
      await act(async () => document.querySelector('[aria-label="Swap hinge side"]').click());
      assert.deepEqual(changes, [{ type: "reorient-opening", openingId: opening.id, change: "hinge" }]);
      await act(async () => document.querySelector('[aria-label="Close details"]').click());
      assert.equal(closed, 1);
    });
  });

  test("passage Details exposes size and shape without door orientation controls", async () => {
    await withDom(async ({ dom, root }) => {
      const passage = {
        id: "passage", kind: "passage", variant: "arched", archRiseMeters: .15,
        wallId: wall.id, offsetPlanUnits: 1, widthPlanUnits: 1.5,
        openingHeightMeters: 2.1, sillHeightMeters: 0,
      };
      const controller = editor({ kind: "opening", id: passage.id });
      controller.draft.openings = [passage];
      await act(async () => root.render(React.createElement(OpeningDetails, {
        opening: passage, editor: controller, disabled: false, onClose() {},
      })));
      const document = dom.window.document;
      assert.ok(document.querySelector('[aria-label="Passage properties"]'));
      assert.equal(document.querySelector('[aria-label="Opening width"]').value, "1.5");
      assert.equal(document.querySelector('[aria-label="Opening height"]').value, "2.1");
      assert.ok(document.querySelector('[aria-label="Passage shape"]'));
      assert.ok(document.querySelector('[aria-label="Passage arch rise"]'));
      assert.equal(document.querySelector('.opening-direction'), null);
    });
  });

  test("opening size edits update the preview and reject sizes that cannot fit", async () => {
    await withDom(async ({ dom, root }) => {
      let controller;
      function Harness() {
        controller = useConstructEditor(neutralDemoManifest.floors[0]);
        const selected = controller.draft.openings.find(candidate => candidate.id === "demo-window");
        return React.createElement(OpeningDetails, { opening: selected, editor: controller, disabled: false, onClose() {} });
      }
      await act(async () => root.render(React.createElement(Harness)));
      await act(async () => controller.selectOpening("demo-window"));
      await act(async () => controller.updateSelectedOpening({ widthPlanUnits: .8 }));
      assert.equal(controller.previewFloor.openings.find(candidate => candidate.id === "demo-window").widthPlanUnits, .8);
      assert.equal(dom.window.document.querySelector('[aria-label="Opening width"]').value, "0.8");
      await act(async () => controller.updateSelectedOpening({ widthPlanUnits: 99 }));
      assert.match(dom.window.document.querySelector('[role="alert"]').textContent, /does not fit/);
      assert.equal(controller.draft.openings.find(candidate => candidate.id === "demo-window").widthPlanUnits, .8);
      await act(async () => controller.resizeSelectedOpening(1.45, 1.1));
      assert.equal(dom.window.document.querySelector('[aria-label="Opening width"]').value, "1.1");
      assert.equal(dom.window.document.querySelector('[role="alert"]'), null);
      await act(async () => controller.updateSelectedOpening({ openingHeightMeters: 99 }));
      assert.ok(dom.window.document.querySelector('[role="alert"]'));
      await act(async () => controller.updateSelectedOpening({ openingHeightMeters: 1.1 }));
      assert.equal(dom.window.document.querySelector('[role="alert"]'), null);
      assert.equal(controller.previewFloor.openings.find(candidate => candidate.id === "demo-window").openingHeightMeters, 1.1);
    });
  });

  test("orientation actions match the operation and panel count", async () => {
    await withDom(async ({ dom, root }) => {
      const cases = [
        [{ ...opening }, ["Swap hinge side", "Reverse opening direction"]],
        [{ ...opening, panelCount: 2 }, ["Reverse opening direction"]],
        [{ ...opening, operation: "fixed" }, []],
        [{ kind: "door", operation: "hinged", leafCount: 1 }, ["Swap hinge side", "Reverse opening direction"]],
        [{ kind: "door", operation: "hinged", leafCount: 2 }, ["Reverse opening direction"]],
        [{ kind: "door", operation: "sliding", leafCount: 1 }, ["Reverse slide direction", "Switch wall side"]],
        [{ kind: "door", operation: "sliding", leafCount: 2 }, ["Switch wall side"]],
      ];
      for (const [candidate, labels] of cases) {
        await act(async () => root.render(React.createElement(OpeningOrientationControls, { opening: candidate, onChange() {} })));
        assert.deepEqual([...dom.window.document.querySelectorAll('button')].map((button) => button.getAttribute('aria-label')), labels);
      }
    });
  });

  test("offers Duplicate for every opening kind and disables only that action when the wall is full", async () => {
    await withDom(async ({ dom, root }) => {
      const calls = [];
      const actions = {
        detailsOpen: false,
        disabled: false,
        canDuplicate: true,
        onDetails: () => calls.push("details"),
        onChange: (change) => calls.push(change),
        onDuplicate: () => calls.push("duplicate"),
        onDelete: () => calls.push("delete"),
      };
      await act(async () => root.render(React.createElement(SelectedOpeningActionBar, { opening, ...actions })));
      let buttons = [...dom.window.document.querySelectorAll("button")];
      assert.deepEqual(buttons.map((button) => button.getAttribute("aria-label")),
        ["Details", "Duplicate", "Swap hinge side", "Reverse opening direction", "Delete"]);
      await act(async () => dom.window.document.querySelector('[aria-label="Duplicate"]').click());
      assert.deepEqual(calls, ["duplicate"]);

      const passage = {
        ...opening, id: "passage", kind: "passage", variant: "arched", archRiseMeters: .15,
      };
      await act(async () => root.render(React.createElement(SelectedOpeningActionBar, {
        opening: passage, ...actions, canDuplicate: false,
      })));
      buttons = [...dom.window.document.querySelectorAll("button")];
      assert.deepEqual(buttons.map((button) => button.getAttribute("aria-label")), ["Details", "Duplicate", "Delete"]);
      assert.equal(buttons[0].disabled, false);
      assert.equal(buttons[1].disabled, true);
      assert.equal(buttons[1].title, "No free space on this wall.");
      assert.equal(buttons[2].disabled, false);
      await act(async () => buttons[0].click());
      assert.deepEqual(calls, ["duplicate", "details"]);
    });
  });

  test("shows every contextual issue with a compact error and warning summary", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null),
        planImportControls: React.createElement("section", { "aria-label": "Build from a floor plan" }, "Have a floor plan?"),
        contextualIssues: [
          {
            code: "construct.opening-outside-wall",
            severity: "error",
            message: "The window extends beyond its wall.",
            suggestion: "Move it inward or reduce its width.",
            target: { kind: "opening", id: opening.id },
          },
          {
            code: "construct.room-no-exit",
            severity: "warning",
            message: "The bedroom has no walkable exit.",
            target: { kind: "room", id: "bedroom" },
          },
          {
            code: "construct.spawn-blocked",
            severity: "fatal",
            message: "No safe walk position was found.",
          },
        ],
      })));

      const document = dom.window.document;
      const card = document.querySelector("[aria-label='Construction validation']");
      assert.ok(card);
      assert.ok(card.compareDocumentPosition(document.querySelector("[aria-label='Build from a floor plan']")) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.match(card.textContent, /3 issues/);
      assert.match(card.textContent, /2 errors · 1 warning/);
      assert.match(card.textContent, /The window extends beyond its wall/);
      assert.match(card.textContent, /Move it inward or reduce its width/);
      assert.match(card.textContent, /The bedroom has no walkable exit/);
      assert.match(card.textContent, /No safe walk position was found/);
      assert.equal(card.querySelectorAll("li").length, 3);
      assert.doesNotMatch(document.body.textContent, /Structure data/);
    });
  });

  test("lists all legacy topology and dependency issues until the aggregate is connected", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null, {
          topologyIssues: [
            { code: "topology.first", severity: "fatal", path: "walls[0]", message: "First topology issue" },
            { code: "topology.second", severity: "warning", path: "walls[1]", message: "Second topology issue" },
          ],
        }),
        dependencyIssues: [
          { code: "dependency.ceiling", severity: "error", path: "sceneItems[0]", message: "Ceiling dependency issue" },
        ],
      })));

      const card = dom.window.document.querySelector("[aria-label='Construction validation']");
      assert.ok(card);
      assert.match(card.textContent, /3 issues/);
      assert.match(card.textContent, /First topology issue/);
      assert.match(card.textContent, /Second topology issue/);
      assert.match(card.textContent, /Ceiling dependency issue/);
    });
  });

  test("selects targeted walls, openings, and rooms from validation rows", async () => {
    const selections = [];
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null, {
          selectWall: (id) => selections.push(["wall", id]),
          selectOpening: (id) => selections.push(["opening", id]),
          selectRoom: (id) => selections.push(["room", id]),
        }),
        contextualIssues: [
          { code: "wall", severity: "error", message: "Wall problem", target: { kind: "wall", id: wall.id } },
          { code: "opening", severity: "warning", message: "Opening problem", target: { kind: "opening", id: opening.id } },
          { code: "room", severity: "error", message: "Room problem", target: { kind: "room", id: "bedroom" } },
          { code: "floor", severity: "warning", message: "Floor-wide note" },
        ],
      })));

      const document = dom.window.document;
      const targetButtons = [...document.querySelectorAll(".construction-inspector__validation button")];
      assert.equal(targetButtons.length, 3);
      for (const button of targetButtons) await act(async () => button.click());
      assert.deepEqual(selections, [
        ["wall", wall.id],
        ["opening", opening.id],
        ["room", "bedroom"],
      ]);
      assert.equal(document.querySelectorAll(".construction-inspector__validation li > div").length, 1);
    });
  });

  test("offers a locate action for junction and item diagnostics", async () => {
    const focused = [];
    await withDom(async ({ dom, root }) => {
      const junctionIssue = {
        code: "wall-junction.opening-overlap",
        severity: "error",
        source: "project",
        path: "floor.wallJunctions[0]",
        message: 'Junction overlaps opening "living-window" on wall "living-east".',
        suggestion: "Move the opening away from this corner.",
        target: { kind: "junction", id: "living-corner" },
      };
      const itemIssue = {
        code: "project.wall-support-missing",
        severity: "error",
        source: "dependency",
        path: "sceneItems[0].placement",
        message: "The supporting wall no longer exists.",
        suggestion: "Choose an existing wall.",
        target: { kind: "scene-item", id: "armchair" },
      };
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null),
        contextualIssues: [junctionIssue, itemIssue],
        onIssueFocus: (issue) => focused.push(issue),
      })));

      const card = dom.window.document.querySelector("[aria-label='Construction validation']");
      assert.match(card.textContent, /Opening is too close to this corner/);
      assert.match(card.textContent, /The supporting wall no longer exists/);
      assert.equal(card.querySelectorAll("button").length, 2);
      assert.equal(card.querySelectorAll(".construction-inspector__validation-arrow")[0].textContent, "Locate →");
      for (const button of card.querySelectorAll("button")) await act(async () => button.click());
      assert.deepEqual(focused, [junctionIssue, itemIssue]);
    });
  });

  test("hides validation when the canonical issue list is empty", async () => {
    await withDom(async ({ dom, root }) => {
      await act(async () => root.render(React.createElement(ConstructionInspector, {
        editor: editor(null),
        contextualIssues: [],
      })));
      assert.equal(dom.window.document.querySelector("[aria-label='Construction validation']"), null);
    });
  });
});

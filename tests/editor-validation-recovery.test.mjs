import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { useConstructEditor } = await load("/apps/web/src/editor-preview/construct/useConstructEditor.ts");
  const { useValidationLabels } = await load("/apps/web/src/editor-preview/construct/useValidationLabels.ts");
  const { collectConstructContextualIssues, visibleConstructIssues } = await load("/apps/web/src/editor-preview/construct/contextual-validation.ts");
  const { constructIssueKey, constructIssuePlanPoint, constructIssueVisualTargets } = await load("/apps/web/src/editor-preview/construct/validation-visuals.ts");
  const { ConstructionInspector } = await load("/apps/web/src/editor-preview/construct/ConstructionInspector.tsx");
  const { interactionFloor: acceptedFloor } = await load("/tests/fixtures/interaction-floor.ts");
  const { createEmptyHomeProject } = await load("/packages/engine/src/index.ts");
  const { deriveFloorTopology } = await load("/packages/engine/src/home-editor/construct/topology.ts");
  const { validateHomeProject } = await load("/packages/engine/src/home-project/validation.ts");
  const { projectFromEditorState } = await load("/apps/web/src/editor-preview/project-sync.ts");
  const ownerHomeProject = { ...createEmptyHomeProject("construction-fixture", "Construction fixture"),
    coordinates: acceptedFloor.coordinates, floors: [acceptedFloor] };
  const { ownerProjectRegistries } = await load("/apps/web/src/project-runtime.ts");

  async function withDom(run) {
    const dom = new JSDOM('<!doctype html><div id="root"></div>');
    const previous = { window: globalThis.window, document: globalThis.document, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
    const root = createRoot(dom.window.document.getElementById("root"));
    try { await run(root, dom.window.document); }
    finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  }

  test("separator walls survive draft recovery without errors and can later close a room", async () => {
    await withDom(async (root, document) => {
      let editor;
      let allIssues;
      const focused = [];
      function Harness({ floor = acceptedFloor }) {
        editor = useConstructEditor(floor, acceptedFloor);
        const project = projectFromEditorState(ownerHomeProject, editor.previewFloor, ownerHomeProject.sceneItems);
        allIssues = collectConstructContextualIssues({
          floor: editor.previewFloor, topologyIssues: editor.topologyIssues,
          projectIssues: validateHomeProject(project, ownerProjectRegistries).issues,
        });
        return React.createElement(ConstructionInspector, { editor, contextualIssues: visibleConstructIssues(allIssues, editor.tool), onIssueFocus: issue => focused.push(issue) });
      }
      await act(async () => root.render(React.createElement(Harness)));
      assert.equal(editor.topologyIssues.length, 0);
      const corners = [[0, -5], [3, -5], [3, -2], [0, -2]];
      await act(async () => editor.setTool("wall"));
      await act(async () => editor.beginWall(corners[0]));
      for (const corner of corners.slice(1)) await act(async () => editor.addWall(corner));
      assert.equal(document.querySelector('[aria-label="Construction validation"]'), null, "do not interrupt wall drawing with closure issues");
      assert.equal(allIssues.length, 0, "separator walls do not block Apply");
      await act(async () => editor.cancelWall());
      assert.equal(editor.tool, "wall");
      assert.equal(document.querySelector('[aria-label="Construction validation"]'), null, "ending a chain does not leave Wall mode");
      await act(async () => editor.setTool("select"));
      assert.equal(editor.topologyIssues.length, 0);
      assert.equal(document.querySelectorAll('.construction-inspector__validation button').length, 0);
      const recovered = structuredClone(editor.previewFloor);
      await act(async () => root.render(React.createElement(Harness, { key: "recovered", floor: recovered })));
      assert.equal(editor.topologyIssues.filter(issue => issue.code === "topology.open-walls").length, 0);
      assert.equal(document.querySelectorAll('.construction-inspector__validation button').length, 0, "recovered separators remain valid in Select");
      await act(async () => editor.setTool("wall"));
      assert.equal(document.querySelector('[aria-label="Construction validation"]'), null, "resuming Wall defers the existing completion issues again");
      await act(async () => editor.beginWall(corners[3]));
      await act(async () => editor.addWall(corners[0]));
      assert.equal(editor.topologyIssues.filter(issue => issue.code === "topology.open-walls").length, 0, JSON.stringify({issues: editor.topologyIssues, walls: editor.draft.walls.filter(w => w.from[1] < 0 || w.to[1] < 0)}));
      const shack = editor.previewFloor.rooms.find(room => room.polygon.every(point => point[1] < 0));
      assert.ok(shack);
      assert.equal(editor.drawStart, null);
      assert.equal(editor.tool, "select", "closing a room returns to Select");
      assert.match(shack.name, /^Unnamed room \d+$/);
      assert.equal(allIssues.length, 0, "new rooms receive valid default names");
      await act(async () => editor.updateRoom(shack.id, { name: "" }));
      assert.equal(allIssues.length, 1, "real topology and project validators produce one naming issue for an explicitly blank name");
      assert.equal(allIssues[0].code, "room.name");
      assert.ok(document.querySelector('[aria-label="Construction validation"]'), "the naming prompt appears after automatic return to Select");
      const namingButtons = document.querySelectorAll('.construction-inspector__validation button');
      assert.equal(namingButtons.length, 1);
      assert.match(namingButtons[0].textContent, /Name this room/);
      assert.doesNotMatch(namingButtons[0].textContent, /Expected a non-empty string/);
      await act(async () => editor.selectRoom(shack.id));
      await act(async () => editor.updateSelectedRoom({ name: "Wooden shack" }));
      assert.equal(editor.topologyIssues.length, 0, JSON.stringify(editor.topologyIssues));
      assert.equal(allIssues.length, 0, "naming the room clears every validator's issue");
      assert.equal(editor.previewFloor.footprintRegions.length, 2);
      await act(async () => editor.replaceFloor(recovered));
      assert.equal(editor.topologyIssues.filter(issue => issue.code === "topology.open-walls").length, 0, "restoring separator walls does not create diagnostics");
    });
  });

  test("Locate restores a hidden label repeatedly, and resolved errors are not permanently hidden", async () => {
    await withDom(async root => {
      const issue = { code: "topology.wall-overlap", path: 'walls["shack"]', message: "Walls overlap.", source: "topology", severity: "fatal", suggestion: "Remove the overlap.", target: { kind: "wall", id: "shack" } };
      const key = constructIssueKey(issue);
      let labels;
      function Harness({ issues = [issue], focusVersion = 0 }) {
        labels = useValidationLabels(issues, key, focusVersion);
        return null;
      }
      await act(async () => root.render(React.createElement(Harness)));
      for (const focusVersion of [1, 2]) {
        await act(async () => labels.hide([key]));
        assert.equal(labels.hiddenKeys.has(key), true);
        await act(async () => root.render(React.createElement(Harness, { focusVersion })));
        assert.equal(labels.hiddenKeys.has(key), false);
      }
      await act(async () => labels.hide([key]));
      await act(async () => root.render(React.createElement(Harness, { issues: [], focusVersion: 2 })));
      await act(async () => root.render(React.createElement(Harness, { focusVersion: 2 })));
      assert.equal(labels.hiddenKeys.has(key), false);
    });
  });

  test("an open extension on a split source wall remains valid and retains its geometry", () => {
    const result = deriveFloorTopology({
      floorId: "floor", floorName: "Floor", rooms: [], openings: [], walls: [
        { id: "top", from: [0, 0], to: [4, 0] },
        { id: "right", from: [4, 0], to: [4, 3] },
        { id: "bottom", from: [4, 3], to: [0, 3] },
        { id: "left", from: [0, 3], to: [0, 0] },
        { id: "divider", from: [2, 0], to: [2, 5] },
      ],
    });
    const open = result.issues.filter(issue => issue.code === "topology.open-walls");
    assert.equal(open.length, 0);
    assert.equal(result.floor.rooms.length, 2);
    const extension = result.floor.walls.find(wall => wall.id === "divider--split-2");
    assert.ok(extension, "retain the separator beyond the closed rooms");
  });
});

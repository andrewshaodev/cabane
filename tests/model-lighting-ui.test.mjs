import assert from "node:assert/strict";
import test from "node:test";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

await withModules(async (load) => {
  const { ModelLightingDialog } = await load(
    "/apps/web/src/model-lighting/ModelLightingDialog.tsx",
  );
  const { saveModelLighting } = await load("/apps/web/src/model-lighting/save-model-lighting.ts");
  const { useEditorWorkspace } = await load("/apps/web/src/editor-preview/useEditorWorkspace.ts");
  const { ownerProjectRegistries } = await load("/apps/web/src/project-runtime.ts");
  const api = await load("/packages/engine/src/index.ts");
  const { makeThreeFloorProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("lighting Save explains a stale workspace and keeps both saved content and the open draft", () =>
    withStorageDom(async (dom) => {
      const project = makeThreeFloorProject();
      const modelId = "open-cube-bookcase";
      const native = ownerProjectRegistries;
      project.sceneItems = [
        {
          id: "bookcase",
          kind: "furnishing",
          floorId: project.floors[0].id,
          modelId,
          size: native.furnishingModels[modelId].defaultSize,
          placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0 },
        },
      ];
      const repository = api.createWorkspaceRepository(dom.indexedDB, native);
      const entry = await repository.create(api.createSeedProjectRecord(project), {
        name: "Save conflict",
      });
      const records = api.createHomeProjectRepository(
        api.createIndexedDbProjectRecordStore(dom.indexedDB),
        native,
      );
      const lifecycle = api.createHomeProjectLifecycle(records, entry.record.draft);
      let workspace;
      function Harness() {
        workspace = useEditorWorkspace({ initialRecord: entry.record, lifecycle });
        return null;
      }
      dom.document.body.innerHTML = '<div id="root"></div>';
      await dom.mount(async () => {
        const root = createRoot(dom.document.querySelector("#root"));
        root.render(React.createElement(Harness));
        return { unmount: () => root.unmount() };
      });
      const newer = await lifecycle.autosave(entry.record, {
        ...entry.record.draft,
        home: { ...entry.record.draft.home, name: "Saved elsewhere" },
      });
      assert.equal(newer.status, "saved");
      const light = {
        position: [-0.1114, 0.68787, -0.128],
        color: "#ffe3b4",
        maxIntensity: 2,
        distance: 5,
      };
      let error;
      await React.act(async () => {
        try {
          await saveModelLighting(workspace, modelId, light, native, () => {});
        } catch (caught) {
          error = caught;
        }
      });
      assert.match(error.message, /newer saved version.*Reopen/);
      assert.deepEqual(workspace.snapshot.project.modelLights[modelId], light);
      assert.deepEqual((await repository.read(entry.record.homeId)).record, newer.record);
    }));
  test("missing original assets block lighting saves, preserve the draft and restore focus on cancel", () =>
    withStorageDom(async (dom) => {
      const custom = {
        id: "custom:11111111-2222-4333-8444-555555555555",
        name: "Missing model",
        placement: "floor",
        profile: "furniture",
        asset: { sha256: "a".repeat(64), byteLength: 1 },
        normalization: {
          rotation: [0, 0, 0],
          scale: 1,
          offset: [0, 0, 0],
          size: [1, 1, 1],
          bounds: { min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] },
        },
        complexity: { triangles: 12, visibleMeshes: 1 },
      };
      const project = {
        ...makeThreeFloorProject(),
        customModels: [custom],
        sceneItems: [
          {
            id: "copy",
            kind: "furnishing",
            floorId: "ground",
            modelId: custom.id,
            size: [1, 1, 1],
            placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0 },
          },
        ],
      };
      const before = structuredClone(project);
      let saves = 0;
      dom.document.body.innerHTML =
        '<button id="opener">Edit lighting</button><div id="root"></div>';
      dom.document.querySelector("#opener").focus();
      function Harness() {
        const [open, setOpen] = useState(true);
        return open
          ? React.createElement(ModelLightingDialog, {
              project,
              modelId: custom.id,
              native: { furnishingModels: {}, deviceModels: {} },
              onSave: async () => {
                saves++;
              },
              onCancel: () => setOpen(false),
            })
          : null;
      }
      await dom.mount(async () => {
        const root = createRoot(dom.document.querySelector("#root"));
        root.render(React.createElement(Harness));
        return { unmount: () => root.unmount() };
      });
      await dom.until(() => dom.document.querySelector('[role="alert"]'));
      assert.equal(dom.button("Save for 1 copy").disabled, true);
      assert.deepEqual(project, before);
      assert.equal(saves, 0);
      await dom.click("Cancel");
      assert.equal(dom.document.querySelector("dialog"), null);
      assert.equal(dom.document.activeElement.id, "opener");
      assert.deepEqual(project, before);
    }));
});

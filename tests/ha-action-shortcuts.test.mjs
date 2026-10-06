import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const engine = await load("/packages/engine/src/index.ts");
  const { useHaActionShortcuts } = await load("/packages/engine/src/action-bar/useHaActionShortcuts.ts");
  const { ActionBarEditor } = await load("/apps/web/src/editor-action-bar/ActionBarEditor.tsx");
  const { ownerHomeProject } = await load("/tests/fixtures/bundled-home.ts");
  const { ownerProjectRegistries } = await load("/apps/web/src/project-runtime.ts");
  const remote = await load("/apps/web/src/workspaces/workspace-remote-transfer.ts");
  const transfer = await load("/apps/web/src/workspaces/workspace-transfer.ts");
  const scene = { id: "evening", target: { kind: "scene" } };
  const script = { id: "routine", target: { kind: "script" } };
  const project = { ...structuredClone(ownerHomeProject), actionBar: { items: [scene, script] } };
  const manifest = engine.composeHomeBindingManifest(project, { furnishingModels: {}, deviceModels: {}, openingModels: {} });
  const profile = { ...engine.createEmptyRuntimeBindingProfile(project.home.id), actionEntityIdsByShortcutId: { evening: "scene.synthetic_evening", routine: "script.synthetic_routine" } };
  const runtime = () => ({ status: "connected", canMutate: true, configured: true, origin: "https://synthetic.invalid", areas: [], devices: [], entityRegistry: [],
    entityStates: {
      "scene.synthetic_evening": { entityId: "scene.synthetic_evening", state: "unknown", available: false, stale: false, attributes: { friendly_name: "Evening scene" } },
      "script.synthetic_routine": { entityId: "script.synthetic_routine", state: "on", available: true, stale: false, attributes: { friendly_name: "Daily routine" } },
    },
  });
  test("scene and running script activation always use exact turn_on targets; scenes may be unknown", () => {
    for (const item of [scene, script]) assert.deepEqual(engine.haActionShortcutCall(item, profile, runtime()), {
      domain: item.target.kind, service: "turn_on", target: { entity_id: profile.actionEntityIdsByShortcutId[item.id] },
    });
    assert.equal(engine.haActionShortcutChoices("scene", runtime())[0].label, "Evening scene");
    const renamed = runtime();
    renamed.entityRegistry = [{ entity_id: "scene.synthetic_evening", name: "Owner name" }];
    assert.equal(engine.resolveHaActionShortcut(scene, profile, renamed).label, "Owner name");
  });
  test("unmapped, wrong-domain, disconnected, missing, disabled, unavailable and stale targets cannot dispatch", () => {
    assert.throws(() => engine.haActionShortcutCall(scene, { ...profile, actionEntityIdsByShortcutId: {} }, runtime()), /Choose a scene/);
    assert.throws(() => engine.haActionShortcutCall(scene, { ...profile, actionEntityIdsByShortcutId: { evening: "script.synthetic_routine" } }, runtime()), /incompatible/);
    for (const change of [r => { r.status = "disconnected"; }, r => { r.canMutate = false; }, r => { r.entityStates = {}; },
      r => { r.entityStates["scene.synthetic_evening"].stale = true; }, r => { r.entityStates["scene.synthetic_evening"].state = "unavailable"; },
      r => { r.entityRegistry = [{ entity_id: "scene.synthetic_evening", disabled_by: "user" }]; }]) {
      const r = runtime(); change(r);
      assert.equal(engine.resolveHaActionShortcut(scene, profile, r).available, false);
      assert.throws(() => engine.haActionShortcutCall(scene, profile, r));
    }
  });
  test("profiles remain backward compatible and reject wrong domains or orphan shortcut IDs", () => {
    assert.equal(engine.validateRuntimeBindingProfile(engine.createEmptyRuntimeBindingProfile(project.home.id), manifest).valid, true);
    assert.equal(engine.validateRuntimeBindingProfile(profile, manifest).valid, true);
    for (const mappings of [{ evening: "light.synthetic" }, { orphan: "scene.synthetic" }, []])
      assert.equal(engine.validateRuntimeBindingProfile({ ...profile, actionEntityIdsByShortcutId: mappings }, manifest).valid, false);
    assert.deepEqual(engine.validateRuntimeBindingProfile(JSON.parse(engine.exportRuntimeBindingProfile(profile)), manifest).profile, profile);
    assert.deepEqual(engine.automaticallyMapRuntimeBindings(manifest, profile, runtime()).profile.actionEntityIdsByShortcutId, profile.actionEntityIdsByShortcutId);
  });
  test("autosave, Apply, reload, private transfer and reconciliation preserve the private boundary", async () => {
    const repository = engine.createHomeProjectRepository(engine.createMemoryProjectRecordStore(), ownerProjectRegistries);
    const lifecycle = engine.createHomeProjectLifecycle(repository, ownerHomeProject);
    const loaded = await lifecycle.load();
    assert.equal(loaded.status, "ready");
    const origin = runtime().origin;
    const bindings = { [origin]: { draft: profile, published: engine.createEmptyRuntimeBindingProfile(project.home.id), manualRoomIds: [], manualSlotIds: [] } };
    const saved = await lifecycle.autosave(loaded.record, project, 2, bindings);
    assert.equal(saved.status, "saved");
    assert.equal(saved.record.bindings[origin].published.actionEntityIdsByShortcutId, undefined);
    const published = await lifecycle.publish(saved.record, { confirmWarnings: true, now: 3 });
    assert.equal(published.status, "published", JSON.stringify(published));
    const reloaded = await lifecycle.load();
    assert.deepEqual(reloaded.record.bindings[origin].published.actionEntityIdsByShortcutId, profile.actionEntityIdsByShortcutId);
    assert.doesNotMatch(lifecycle.exportRecord(reloaded.record), /synthetic_evening|synthetic_routine|synthetic.invalid/);
    const backup = transfer.exportPrivateWorkspaceRecord(reloaded.record);
    const imported = transfer.parseWorkspaceImport(backup, ownerProjectRegistries);
    assert.deepEqual(imported.record.bindings[origin].published.actionEntityIdsByShortcutId, profile.actionEntityIdsByShortcutId);
    const envelope = transfer.exportWorkspaceBackup({ name: project.home.name, homeAssistantUrl: origin, hasPublished: true }, reloaded.record);
    let restoredRecord;
    await remote.restoreRemoteWorkspace({ restoreExact: async record => { restoredRecord = record; return {}; } }, envelope, undefined, project.home.id, origin);
    assert.deepEqual(restoredRecord.bindings[origin].published.actionEntityIdsByShortcutId, profile.actionEntityIdsByShortcutId);
    const reconciled = engine.reconcileWorkspaceBindings(reloaded.record.bindings, { ...manifest, actionBar: { items: [script] } });
    assert.deepEqual(reconciled[origin].draft.actionEntityIdsByShortcutId, { routine: "script.synthetic_routine" });
    assert.deepEqual(reconciled[origin].published.actionEntityIdsByShortcutId, profile.actionEntityIdsByShortcutId);
  });
  const withDom = async fn => {
    const dom = new JSDOM('<div id="root"></div>');
    const keys = ["window", "document", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
    const root = createRoot(document.getElementById("root"));
    try { await fn(root); } finally { await act(async () => root.unmount()); Object.assign(globalThis, previous); dom.window.close(); }
  };
  test("command hook guards duplicate clicks, reports rejection, clears pending and supports retry", async () => withDom(async root => {
    let hook; let reject; let calls = 0; const errors = [];
    const r = { ...runtime(), callService: () => { calls++; return new Promise((_, no) => { reject = no; }); } };
    function Probe() { hook = useHaActionShortcuts(r, profile, message => errors.push(message)); return null; }
    await act(async () => root.render(React.createElement(Probe)));
    let running;
    await act(async () => { running = hook.run(script); void hook.run(script); });
    assert.equal(calls, 1); assert.equal(hook.pending.has(script.id), true);
    await act(async () => { reject(new Error("Synthetic service failure")); await running; });
    assert.equal(hook.pending.size, 0); assert.equal(errors.at(-1), "Synthetic service failure");
    r.callService = async call => { calls++; assert.equal(call.service, "turn_on"); };
    await act(async () => hook.run(script));
    assert.equal(calls, 2); assert.equal(errors.at(-1), null);
    r.status = "disconnected";
    await act(async () => hook.run(script));
    assert.equal(calls, 2); assert.match(errors.at(-1), /not connected/);
  }));
  test("normal shortcut editor maps a named HA scene atomically without embedding its entity ID in the project", async () => withDom(async root => {
    const changes = [];
    const props = { project: { ...project, actionBar: { items: [] } }, profile: { ...profile, actionEntityIdsByShortcutId: {} }, runtime: runtime(), actionMappingEnabled: true,
      deviceModels: {}, roomPictures: {}, disabled: false, canUndo: false, canRedo: false, onUndo() {}, onRedo() {}, onChange: (...args) => changes.push(args) };
    await act(async () => root.render(React.createElement(ActionBarEditor, props)));
    await act(async () => document.querySelector('[aria-label="Add shortcut"]').click());
    await act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === "Add scene").click());
    await act(async () => document.querySelector('[aria-label="Evening scene"]').click());
    const [items, mapping] = changes[0];
    assert.equal(items[0].target.kind, "scene");
    assert.equal(mapping.id, items[0].id); assert.equal(mapping.entityId, "scene.synthetic_evening");
    assert.doesNotMatch(JSON.stringify(items), /synthetic_evening/);
    props.project.actionBar.items = items;
    props.profile.actionEntityIdsByShortcutId = { [mapping.id]: mapping.entityId };
    await act(async () => root.render(React.createElement(ActionBarEditor, props)));
    assert.ok(document.querySelector('[aria-label="Edit Evening scene shortcut"]'));
  }));
});

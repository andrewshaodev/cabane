import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
import {
  connectedManifestFixture,
  connectedProfileFixture,
} from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const transfer = await load("/packages/engine/src/browser-data-transfer.ts");
  const auth = await load("/packages/engine/src/home-assistant-auth.ts");
  const profiles = await load("/packages/engine/src/runtime-binding-profile.ts");
  const floors = await load("/packages/engine/src/home-project/legacy-floor-storage.ts");
  const { createFloorEditorDraft } = await load("/packages/engine/src/home-editor/construct/editor-state.ts");
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const manifest = connectedManifestFixture(neutralDemoManifest);
  const origin = "http://fixture-ha.local:8123";

  const createStorage = () => {
    const values = new Map();
    return {
      values,
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
      },
    };
  };

  test("exports and imports only validated, non-secret browser-owned data", () => {
    const source = createStorage();
    const profile = connectedProfileFixture();
    profile.entityIdsBySlotId = {};
    const layoutFloor = structuredClone(manifest.floors[0]);
    for (const room of layoutFloor.rooms) {
      room.dashboardSlots = [];
      room.devices = [];
    }
    for (const opening of layoutFloor.openings) delete opening.contactSlot;
    auth.saveStoredHomeAssistantUrl(source.storage, origin);
    profiles.saveRuntimeBindingProfile(source.storage, origin, profile);
    floors.saveActiveFloorLayout(source.storage, manifest.home.id, layoutFloor);
    const draft = createFloorEditorDraft(layoutFloor);
    draft.floorName = "Transferred draft";
    floors.saveFloorLayoutDraft(source.storage, manifest.home.id, draft);
    source.values.set(auth.HOME_ASSISTANT_TOKEN_STORAGE_KEY, JSON.stringify({ access_token: "never-export" }));

    const json = transfer.exportCabaneBrowserData(source.storage, manifest);
    assert.equal(json.includes("never-export"), false);
    assert.equal(json.includes("access_token"), false);
    assert.equal(json.includes("onboarding"), false);
    assert.equal(json.includes("scene-session"), false);

    const target = createStorage();
    const result = transfer.importCabaneBrowserData(json, target.storage, manifest);
    assert.equal(result.valid, true, JSON.stringify(result.issues));
    assert.equal(auth.loadStoredHomeAssistantUrl(target.storage), origin);
    assert.deepEqual(profiles.loadRuntimeBindingProfile(target.storage, origin, manifest), profile);
    assert.equal(floors.loadActiveFloorLayout(target.storage, manifest.home.id).status, "valid");
    assert.equal(floors.loadFloorLayoutDraft(target.storage, manifest.home.id, manifest.floors[0]).floorName, "Transferred draft");
    assert.equal(target.values.has(auth.HOME_ASSISTANT_TOKEN_STORAGE_KEY), false);
  });

  test("rejects an incompatible transfer before writing any browser data", () => {
    const target = createStorage();
    const json = JSON.stringify({
      type: "cabane-browser-data",
      schemaVersion: 1,
      homeId: "another-home",
      homeAssistantUrl: origin,
    });
    const result = transfer.importCabaneBrowserData(json, target.storage, manifest);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.code === "transfer.home"));
    assert.equal(target.values.size, 0);
  });
});

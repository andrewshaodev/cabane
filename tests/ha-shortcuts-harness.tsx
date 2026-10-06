import { stableArchitectureModelRegistry } from "@cabane/catalog/architecture";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CabaneDashboard, FloorNavigationProvider, composeHomeManifest, createEmptyRuntimeBindingProfile,
  createIndexedDbProjectRecordStore, createHomeProjectRepository, createHomeProjectLifecycle,
  type HomeProjectRecord, type HomeAssistantRuntimeValue, type SupportedServiceCall } from "@cabane/engine";
import { HomeAssistantRuntimeValueProvider } from "../packages/engine/src/HomeAssistantRuntimeContext";
import { HomeEditor } from "../apps/web/src/HomeEditor";
import { makeStairProject, emptyExtensions } from "./fixtures/multiple-floors";
import "@cabane/engine/styles.css";

const seed = makeStairProject();
const origin = "https://synthetic.invalid";
const repository = createHomeProjectRepository(createIndexedDbProjectRecordStore(indexedDB), { furnishingModels: {}, deviceModels: {} });
const lifecycle = createHomeProjectLifecycle(repository, seed);
const loaded = await lifecycle.load();
const calls: SupportedServiceCall[] = [];
let settle: (() => void) | undefined;
let fail = false;
const baseRuntime: HomeAssistantRuntimeValue = {
  origin, configured: true, status: "connected", canMutate: true, error: null,
  areas: [], devices: [], entityRegistry: [], entityStates: {
    "scene.synthetic_evening": { entityId: "scene.synthetic_evening", state: "unknown", available: false, stale: false, attributes: { friendly_name: "Evening scene" } },
    "script.synthetic_routine": { entityId: "script.synthetic_routine", state: "off", available: true, stale: false, attributes: { friendly_name: "Daily routine" } },
    "scene.synthetic_unavailable": { entityId: "scene.synthetic_unavailable", state: "unavailable", available: false, stale: false, attributes: { friendly_name: "Offline scene" } },
  },
  connect() {}, disconnect: async () => {}, retry() {}, refreshing: false, refreshError: null, refresh: async () => {}, cameraClient: null,
  sendStorageMessage: async () => { throw new Error("Storage is not connected in this fixture."); },
  callService: call => { calls.push(call); return new Promise((resolve, reject) => { settle = () => fail ? reject(new Error("Synthetic service failure")) : resolve(undefined); }); },
};
function Harness() {
  const [record, setRecord] = useState<HomeProjectRecord>(loaded.record);
  const [editing, setEditing] = useState(true);
  const [runtime, setRuntime] = useState(baseRuntime);
  Object.assign(window, { shortcutFixture: { calls, settle: () => settle?.(), fail: (next: boolean) => { fail = next; },
    setConnected: (connected: boolean) => setRuntime({ ...baseRuntime, status: connected ? "connected" : "disconnected", canMutate: connected }),
    readRecord: () => repository.load(seed.home.id),
  } });
  return <HomeAssistantRuntimeValueProvider value={runtime}><FloorNavigationProvider>
    {editing ? <HomeEditor initialRecord={record} lifecycle={lifecycle} homeAssistantUrl={origin} autosaveDelayMs={0}
      initialRequest={{ mode: "construct", panel: "action-bar" }} onClose={next => { setRecord(next); setEditing(false); }} />
      : <CabaneDashboard manifest={composeHomeManifest(record.published, emptyExtensions)} deviceModels={{}} architectureModels={stableArchitectureModelRegistry}
        bindingManager={{ profile: record.bindings[origin]?.published ?? createEmptyRuntimeBindingProfile(record.homeId), loaded: true, hasStoredProfile: true, save() {} }}
        onCustomizeActionBar={() => setEditing(true)} />}
  </FloorNavigationProvider></HomeAssistantRuntimeValueProvider>;
}
createRoot(document.getElementById("root")!).render(<Harness />);

import { makeStairProject, emptyExtensions } from "./fixtures/multiple-floors";
import { composeHomeManifest } from "@cabane/engine";
import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { stableDeviceRegistry } from "@cabane/catalog/device";
import { stableArchitectureModelRegistry } from "@cabane/catalog/architecture";
import {
  HomeAssistantMappingScreen,
  saveRuntimeBindingProfile,
  CabaneDashboard,
} from "@cabane/engine";
import { HomeAssistantRuntimeSnapshotTestProvider } from "../packages/engine/src/HomeAssistantRuntime";
import {
  connectedCatalogRuntime,
  equippedFixtureProfile,
  equippedFixtureManifest,
  layoutFixtureManifest,
  scaleFixtureProfile,
  scaleFixtureManifest,
  scaleMappingRuntime,
  unavailableCatalogRuntime,
} from "./fixtures/agent-home";
import "@cabane/engine/styles.css";

const params = new URL(window.location.href).searchParams;
const stage = params.get("stage") ?? "room";
const scenario = params.get("scenario") ?? "disconnected";
const stagedManifest =
  stage === "building"
    ? composeHomeManifest(makeStairProject(), emptyExtensions)
    : stage === "layout"
      ? layoutFixtureManifest
      : stage === "scale"
        ? scaleFixtureManifest
        : equippedFixtureManifest;
const mappingManifest = {
  ...equippedFixtureManifest,
  home: {
    ...equippedFixtureManifest.home,
    id: "home-assistant-mapping-playground-v2",
    name: "Mapping playground",
  },
};
const manifest = scenario === "mapping" ? mappingManifest : stagedManifest;

if (scenario === "connected" || scenario === "unavailable") {
  saveRuntimeBindingProfile(
    window.localStorage,
    stage === "scale" ? scaleMappingRuntime.origin! : connectedCatalogRuntime.origin!,
    stage === "scale" ? scaleFixtureProfile : equippedFixtureProfile,
  );
}

let content: ReactNode = (
  <CabaneDashboard
    manifest={manifest}
    architectureModels={stableArchitectureModelRegistry}
    deviceModels={stableDeviceRegistry}
  />
);

if (scenario === "mapping") {
  const snapshot = {
    ...connectedCatalogRuntime,
    areas: [
      ...connectedCatalogRuntime.areas.map((area) =>
        area.area_id === "fixture_hall" ? { ...area, name: "Entryway" } : area,
      ),
      { area_id: "fixture_patio", name: "Patio", icon: "mdi:patio-heater", picture: null },
    ],
  };
  const mappingProfile = {
    ...equippedFixtureProfile,
    homeId: mappingManifest.home.id,
    roomAreaIds: { "fixture-studio": "fixture_studio" },
  };
  content = (
    <HomeAssistantMappingScreen
      manifest={mappingManifest}
      runtime={snapshot}
      manager={{
        profile: mappingProfile,
        loaded: true,
        hasStoredProfile: true,
        save: () => undefined,
      }}
      refreshing={false}
      refreshError={null}
      onRefresh={async () => undefined}
      onClose={() => undefined}
    />
  );
} else if (scenario === "mapping-scale") {
  content = (
    <HomeAssistantMappingScreen
      manifest={scaleFixtureManifest}
      runtime={scaleMappingRuntime}
      manager={{
        profile: scaleFixtureProfile,
        loaded: true,
        hasStoredProfile: true,
        save: () => undefined,
      }}
      refreshing={false}
      refreshError={null}
      onRefresh={async () => undefined}
      onClose={() => undefined}
    />
  );
} else if (scenario === "connected" || scenario === "unavailable") {
  const snapshot =
    scenario === "connected"
      ? stage === "scale"
        ? scaleMappingRuntime
        : connectedCatalogRuntime
      : unavailableCatalogRuntime;
  content = (
    <HomeAssistantRuntimeSnapshotTestProvider snapshot={snapshot}>
      {content}
    </HomeAssistantRuntimeSnapshotTestProvider>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("The fixture harness root is missing.");

function EvidenceReady({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.evidenceReady = "true";
    return () => {
      delete document.documentElement.dataset.evidenceReady;
    };
  }, []);
  return children;
}

createRoot(root).render(
  <StrictMode>
    <EvidenceReady>{content}</EvidenceReady>
  </StrictMode>,
);

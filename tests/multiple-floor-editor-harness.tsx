import { stableFurnishingRegistry } from "@cabane/catalog/furnishing";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  FloorNavigationProvider,
  createIndexedDbProjectRecordStore,
  createMemoryProjectRecordStore,
  createHomeProjectRepository,
  createHomeProjectLifecycle,
} from "@cabane/engine";
import { HomeEditor } from "../apps/web/src/HomeEditor";
import { makeStairProject, makeOutdoorPlatformProject } from "./fixtures/multiple-floors";
import "@cabane/engine/styles.css";
const scenario = new URLSearchParams(window.location.search).get("scenario");
const seed = scenario === "outdoor" ? makeOutdoorPlatformProject() : makeStairProject();
if (scenario === "handle-overlap") {
  const floor = seed.floors[0];
  floor.walls.push({
    ...floor.walls[0],
    id: "handle-wall",
    from: [2, 5.5],
    to: [6, 5.5],
    thicknessMeters: 0.2,
  });
  floor.openings.push({
    id: "handle-passage",
    kind: "passage",
    variant: "rectangular",
    wallId: "handle-wall",
    offsetFromWallStartPlanUnits: 1,
    widthPlanUnits: 2,
    openingHeightMeters: 2.2,
    sillHeightMeters: 0,
  });
}
if (scenario === "clearance") {
  seed.sceneItems = [
    {
      id: "test-wardrobe",
      kind: "furnishing",
      modelId: "cane-wardrobe",
      floorId: "ground",
      size: [4, 2.15, 0.474],
      placement: {
        kind: "absolute",
        at: [5.8, 3],
        elevationMeters: 0,
        rotationYRadians: Math.PI / 2,
      },
    },
    {
      id: "test-tub",
      kind: "furnishing",
      modelId: "family-bathtub",
      floorId: "ground",
      size: [1.64, 0.782, 0.78],
      placement: { kind: "absolute", at: [2, 5], elevationMeters: 0, rotationYRadians: 0 },
    },
  ];
}
const repository = createHomeProjectRepository(
  new URLSearchParams(window.location.search).get("persistent") === "1"
    ? createIndexedDbProjectRecordStore(indexedDB)
    : createMemoryProjectRecordStore(),
  { furnishingModels: stableFurnishingRegistry, deviceModels: {} },
);
const lifecycle = createHomeProjectLifecycle(repository, seed);
const loaded = await lifecycle.load();
Object.assign(window, {
  readFixtureRecord: async () => await repository.load(seed.home.id),
  readFixtureProject: async () => (await repository.load(seed.home.id))?.draft,
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FloorNavigationProvider>
      <HomeEditor
        initialRecord={loaded.record}
        lifecycle={lifecycle}
        onClose={() => undefined}
        autosaveDelayMs={0}
      />
    </FloorNavigationProvider>
  </StrictMode>,
);

import { stableFurnishingRegistry } from "@cabane/catalog/furnishing";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FloorNavigationProvider, createMemoryProjectRecordStore, createHomeProjectRepository, createHomeProjectLifecycle } from "@cabane/engine";
import { HomeEditor } from "../apps/web/src/HomeEditor";
import { makeStairProject } from "./fixtures/multiple-floors";
import "@cabane/engine/styles.css";
const seed = makeStairProject();
const scenario = new URLSearchParams(window.location.search).get("scenario");
if (scenario === "clearance") {
  seed.sceneItems = [
    {id:"test-wardrobe",kind:"furnishing",modelId:"cane-wardrobe",floorId:"ground",size:[4,2.15,.474],
      placement:{kind:"absolute",at:[5.8,3],elevationMeters:0,rotationYRadians:Math.PI/2}},
    {id:"test-tub",kind:"furnishing",modelId:"family-bathtub",floorId:"ground",size:[1.64,.782,.78],
      placement:{kind:"absolute",at:[2,5],elevationMeters:0,rotationYRadians:0}},
  ];
}
const repository = createHomeProjectRepository(createMemoryProjectRecordStore(), {furnishingModels:stableFurnishingRegistry,deviceModels:{}});
const lifecycle = createHomeProjectLifecycle(repository, seed);
const loaded = await lifecycle.load();
Object.assign(window, { readFixtureProject: async () => (await repository.load(seed.home.id))?.draft });
createRoot(document.getElementById("root")!).render(<StrictMode><FloorNavigationProvider>
  <HomeEditor initialRecord={loaded.record} lifecycle={lifecycle} onClose={() => undefined} autosaveDelayMs={0}/>
</FloorNavigationProvider></StrictMode>);

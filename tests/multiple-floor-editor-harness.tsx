import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FloorNavigationProvider, createMemoryProjectRecordStore, createHomeProjectRepository, createHomeProjectLifecycle } from "@cabane/engine";
import { HomeEditor } from "../apps/web/src/HomeEditor";
import { makeStairProject, emptyRegistries } from "./fixtures/multiple-floors";
import "@cabane/engine/styles.css";
const seed = makeStairProject();
const repository = createHomeProjectRepository(createMemoryProjectRecordStore(), emptyRegistries);
const lifecycle = createHomeProjectLifecycle(repository, seed);
const loaded = await lifecycle.load();
Object.assign(window, { readFixtureProject: async () => (await repository.load(seed.home.id))?.draft });
createRoot(document.getElementById("root")!).render(<StrictMode><FloorNavigationProvider>
  <HomeEditor initialRecord={loaded.record} lifecycle={lifecycle} onClose={() => undefined} autosaveDelayMs={0}/>
</FloorNavigationProvider></StrictMode>);

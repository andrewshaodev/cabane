import { useEffect, useState } from "react";
import { createBuildTutorialState, type HomeProject, type BuildTutorialState } from "@cabane/engine";
import { reconcileBuildTutorial } from "./build-tutorial-progress";
import { readBuildTutorial, writeBuildTutorial } from "./build-tutorial-storage";

export function useBuildTutorial(project: HomeProject, mode: string) {
  const homeId = project.home.id;
  const [stored, setStored] = useState(() => readBuildTutorial(homeId));
  const state = stored.state ? reconcileBuildTutorial(stored.state, project, mode) : undefined;
  const update = (next: BuildTutorialState) => {
    const durable = writeBuildTutorial(homeId, next);
    setStored({ state: next, durable });
  };
  const serialized = JSON.stringify(state);
  useEffect(() => {
    if (state && serialized !== JSON.stringify(stored.state)) update(state);
  }, [serialized]);
  return {
    state,
    warning: stored.durable ? null : "Tutorial progress could not be saved. Your home is still editable.",
    dismiss: () => state && update({ ...state, status: "dismissed" }),
    skip: () => state && update({ ...state, skipped: [...new Set([...state.skipped, state.step])] }),
    ready: () => state && update({ ...state, readyToConnect: true }),
    restart: () => update(createBuildTutorialState()),
  };
}

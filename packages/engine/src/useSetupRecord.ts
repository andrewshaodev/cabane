import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSetupRecord,
  loadSetupRecord,
  saveSetupRecord,
  type SetupRecord,
  type SetupRecordLoadResult,
} from "./setup-progress";

const initialSetupState = (homeId: string): SetupRecordLoadResult => {
  if (typeof window === "undefined") {
    return { record: createSetupRecord(), durable: false, migrated: false, warning: null };
  }
  return loadSetupRecord(window.localStorage, homeId);
};

export function useSetupRecord(homeId: string, constructionApplied = false) {
  const [setupState, setSetupState] = useState(() => initialSetupState(homeId));
  const currentState = useRef(setupState);

  const updateSetupRecord = useCallback((update: (record: SetupRecord) => SetupRecord) => {
    const current = currentState.current;
    const record = update(current.record);
    const durable = typeof window !== "undefined"
      && saveSetupRecord(window.localStorage, homeId, record);
    const next = {
      ...current,
      record,
      durable,
      warning: durable ? null : "Setup progress could not be saved and may not survive reload.",
    };
    // Persist before navigation can unmount onboarding. A queued React state
    // updater is not guaranteed to run when its parent leaves this surface.
    currentState.current = next;
    setSetupState(next);
  }, [homeId]);

  useEffect(() => {
    if (!constructionApplied) return;
    updateSetupRecord((record) => ({ ...record, buildChoice: "construction" }));
  }, [constructionApplied, updateSetupRecord]);

  return { setupState, updateSetupRecord };
}

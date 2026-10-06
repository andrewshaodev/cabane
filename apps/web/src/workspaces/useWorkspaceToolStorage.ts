import { useLayoutEffect, useMemo, useRef } from "react";
import {
  createHomeProjectRepository,
  createIndexedDbProjectRecordStore,
  type HomeProjectRecord,
  type WalkToolStorage,
} from "@cabane/engine";
import { ownerProjectRegistries } from "../project-runtime";
import { updateWorkspaceToolState } from "./workspace-tool-state";

/** Serialize tool writes through the same revision-checked home repository as editing. */
export function useWorkspaceToolStorage(
  record: HomeProjectRecord,
  onSaved: (record: HomeProjectRecord) => void,
  onError: (message: string) => void,
) {
  const current = useRef(record);
  const callbacks = useRef({ onSaved, onError });
  useLayoutEffect(() => {
    current.current = record;
  }, [record]);
  useLayoutEffect(() => {
    callbacks.current = { onSaved, onError };
  });
  const repository = useMemo(
    () =>
      createHomeProjectRepository(
        createIndexedDbProjectRecordStore(window.indexedDB),
        ownerProjectRegistries,
      ),
    [],
  );
  return useMemo(() => {
    let pending: Promise<void> = Promise.resolve();
    const storage: WalkToolStorage = {
      read: (id) => current.current.published.toolState?.[id],
      write: (id, value) => {
        const snapshot = structuredClone(value);
        const operation = pending.then(async () => {
          const previous = current.current;
          const saved = await repository.replace(
            updateWorkspaceToolState(previous, id, snapshot),
            previous.revision,
          );
          current.current = saved;
          callbacks.current.onSaved(saved);
        });
        pending = operation.catch((error) => {
          callbacks.current.onError(
            `Could not save tool changes. Reopen this home and try again. ${error instanceof Error ? error.message : "Storage is unavailable."}`,
          );
        });
        return operation;
      },
    };
    return { storage, flush: () => pending };
  }, [repository]);
}

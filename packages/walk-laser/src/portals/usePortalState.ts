import { useWalkToolStorage } from "@cabane/engine";
import { useCallback, useRef, useState } from "react";
import {
  decodePortalState,
  encodePortalState,
  PORTAL_STORAGE_ID,
  type PortalState,
} from "./portal-state-codec";

/** Optimistic scene feedback; a rejected home write restores the last accepted pair. */
export function usePortalState() {
  const storage = useWalkToolStorage();
  const [state, setState] = useState(() => decodePortalState(storage?.read(PORTAL_STORAGE_ID)));
  const current = useRef(state);
  const pending = useRef(false);
  const commit = useCallback(
    async (next: PortalState) => {
      if (pending.current) return false;
      const previous = current.current;
      pending.current = true;
      current.current = next;
      setState(next);
      try {
        await storage?.write(PORTAL_STORAGE_ID, encodePortalState(next));
        return true;
      } catch {
        current.current = previous;
        setState(previous);
        return false;
      } finally {
        pending.current = false;
      }
    },
    [storage],
  );
  return { state, current, pending, commit };
}

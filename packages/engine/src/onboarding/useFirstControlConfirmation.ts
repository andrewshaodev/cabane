import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HomeAssistantRuntimeValue } from "../HomeAssistantRuntime";
import type { SupportedServiceCall } from "../home-assistant-controls";
import type { EntityStateSnapshot } from "../types";
import { confirmsFirstControl } from "./first-control-confirmation";

/** Observe a normal dashboard call. No extra commands, subscriptions, or history. */
export function useFirstControlConfirmation(runtime: HomeAssistantRuntimeValue, enabled: boolean, onConfirmed: () => void, workspaceId?: string, targetEntityId?: string) {
  const latest = useRef({ runtime, enabled, onConfirmed, workspaceId, targetEntityId });
  latest.current = { runtime, enabled, onConfirmed, workspaceId, targetEntityId };
  const pending = useRef<{ call: SupportedServiceCall; before: EntityStateSnapshot; succeeded: boolean; origin: string | null; workspaceId?: string } | null>(null);
  const inspect = useCallback(() => {
    const candidate = pending.current;
    const active = latest.current;
    if (!active.enabled || active.runtime.status !== "connected" || candidate?.origin !== active.runtime.origin || candidate?.workspaceId !== active.workspaceId) { pending.current = null; return; }
    const after = candidate && active.runtime.entityStates[candidate.before.entityId];
    if (candidate && after && confirmsFirstControl(candidate.call, candidate.before, after, candidate.succeeded)) {
      pending.current = null;
      active.onConfirmed();
    }
  }, []);
  useEffect(inspect, [runtime.entityStates, runtime.status, runtime.origin, workspaceId, enabled, inspect]);
  useEffect(() => () => { pending.current = null; }, []);
  const callService = useCallback(async (call: SupportedServiceCall) => {
    const active = latest.current;
    const id = Array.isArray(call.target.entity_id) ? call.target.entity_id[0] : call.target.entity_id;
    const before = active.runtime.entityStates[id];
    const candidate = active.enabled && before && (!active.targetEntityId || id === active.targetEntityId) && active.runtime.status === "connected"
      ? { call, before, succeeded: false, origin: active.runtime.origin, workspaceId: active.workspaceId } : null;
    pending.current = candidate;
    try {
      const result = await active.runtime.callService(call);
      if (candidate && pending.current === candidate) { candidate.succeeded = true; inspect(); }
      return result;
    } catch (error) {
      if (pending.current === candidate) pending.current = null;
      throw error;
    }
  }, [inspect]);
  return useMemo(() => ({ ...runtime, callService }), [runtime, callService]);
}

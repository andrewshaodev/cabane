import { useRef, useState } from "react";
import type { HomeAssistantRuntimeValue } from "../HomeAssistantRuntimeContext";
import type { RuntimeBindingProfile } from "../types";
import type { ActionBarItem } from "./action-bar-config";
import { haActionShortcutCall } from "./ha-action-shortcuts";

export function useHaActionShortcuts(
  runtime: HomeAssistantRuntimeValue,
  profile: RuntimeBindingProfile,
  onError: (message: string | null) => void,
) {
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const run = async (item: ActionBarItem) => {
    if (pendingRef.current.has(item.id)) return;
    try {
      const call = haActionShortcutCall(item, profile, runtime);
      pendingRef.current.add(item.id);
      setPending(new Set(pendingRef.current));
      onError(null);
      await runtime.callService(call);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : `Home Assistant could not run this ${item.target.kind}. Try again.`,
      );
    } finally {
      pendingRef.current.delete(item.id);
      setPending(new Set(pendingRef.current));
    }
  };
  return { pending, run };
}

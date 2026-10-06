import { useMemo, type ReactNode } from "react";
import type { HomeAssistantRuntimeSnapshot } from "./types";
import {
  HomeAssistantRuntimeValueProvider,
  type HomeAssistantRuntimeValue,
} from "./HomeAssistantRuntimeContext";

export function HomeAssistantRuntimeSnapshotTestProvider({
  snapshot,
  children,
}: {
  snapshot: HomeAssistantRuntimeSnapshot;
  children: ReactNode;
}) {
  const value = useMemo<HomeAssistantRuntimeValue>(
    () => ({
      ...snapshot,
      connect: () => undefined,
      disconnect: async () => undefined,
      retry: () => undefined,
      refreshing: false,
      refreshError: null,
      refresh: async () => undefined,
      callService: async () => {
        throw new Error("Deterministic snapshot fixtures cannot call Home Assistant services.");
      },
      cameraClient: null,
      sendStorageMessage: async () => {
        throw new Error("Snapshot fixtures cannot access Home Assistant storage.");
      },
    }),
    [snapshot],
  );
  return (
    <HomeAssistantRuntimeValueProvider value={value}>{children}</HomeAssistantRuntimeValueProvider>
  );
}

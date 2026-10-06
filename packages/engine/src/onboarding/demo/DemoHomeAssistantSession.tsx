import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  HomeAssistantRuntimeValueProvider,
  type HomeAssistantRuntimeValue,
} from "../../HomeAssistantRuntime";
import type { RuntimeBindingProfileManager } from "../../RuntimeBindingSetup";
import type { SupportedServiceCall } from "../../home-assistant-controls";
import type { HomeManifest } from "../../types";

import { deriveDemoSessionDefinition } from "./demo-session-definition";
import { applyDemoServiceToStates } from "./demo-device-state";
export { deriveDemoSessionDefinition, type DemoSessionDefinition } from "./demo-session-definition";
export { applyDemoServiceCall } from "./demo-device-state";

export function DemoHomeAssistantSession({
  manifest,
  children,
  onInteraction,
}: {
  onInteraction?: () => void;
  manifest: HomeManifest;
  children: (session: {
    manager: RuntimeBindingProfileManager;
    sampleAvailable: boolean;
    sampleLabel: string | null;
  }) => ReactNode;
}) {
  const definition = useMemo(() => deriveDemoSessionDefinition(manifest), [manifest]);
  const [snapshot, setSnapshot] = useState(() => ({
    definition,
    profile: definition.profile,
    entityStates: definition.runtime.entityStates,
  }));
  const current = useRef(snapshot);
  if (snapshot.definition !== definition) {
    current.current = {
      definition,
      profile: definition.profile,
      entityStates: definition.runtime.entityStates,
    };
    setSnapshot(current.current);
  }
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const callService = useCallback(
    async (call: SupportedServiceCall) => {
      if (!live.current || current.current.definition !== definition)
        throw new Error("This demo session is no longer active.");
      const entityStates = applyDemoServiceToStates(current.current.entityStates, call);
      current.current = { ...current.current, entityStates };
      setSnapshot(current.current);
      onInteraction?.();
    },
    [definition, onInteraction],
  );

  const runtime = useMemo<HomeAssistantRuntimeValue>(
    () => ({
      ...definition.runtime,
      entityStates: snapshot.entityStates,
      connect: () => undefined,
      disconnect: async () => undefined,
      retry: () => undefined,
      refreshing: false,
      refreshError: null,
      refresh: async () => undefined,
      callService,
      cameraClient: null,
      sendStorageMessage: async () => {
        throw new Error("The demo cannot access Home Assistant storage.");
      },
    }),
    [callService, definition, snapshot],
  );

  const manager = useMemo<RuntimeBindingProfileManager>(
    () => ({
      profile: snapshot.profile,
      loaded: true,
      hasStoredProfile: false,
      save: (profile) => {
        if (!live.current || current.current.definition !== definition) return;
        current.current = { ...current.current, profile };
        setSnapshot(current.current);
      },
    }),
    [definition, snapshot],
  );

  return (
    <HomeAssistantRuntimeValueProvider value={runtime}>
      {children({
        manager,
        sampleAvailable: definition.sampleEntityId !== null,
        sampleLabel: definition.sampleLabel,
      })}
    </HomeAssistantRuntimeValueProvider>
  );
}

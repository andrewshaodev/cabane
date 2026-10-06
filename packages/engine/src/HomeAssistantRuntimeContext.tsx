import {
  createContext,
  useContext,
  type ReactNode
} from "react";

import type {
  HomeAssistantCameraClient
} from "./camera-runtime";

import type { SupportedServiceCall } from "./home-assistant-controls";

import type {
  EntityId,
  EntityStateSnapshot,
  HomeAssistantRuntimeSnapshot
} from "./types";

export interface HomeAssistantRuntimeValue extends HomeAssistantRuntimeSnapshot {
  connect: () => void;
  disconnect: () => Promise<void>;
  retry: () => void;
  refreshing: boolean;
  refreshError: string | null;
  refresh: () => Promise<void>;
  callService: (call: SupportedServiceCall) => Promise<unknown>;
  cameraClient: HomeAssistantCameraClient | null;
}

export const EMPTY_STATES = {} as Readonly<Record<EntityId, EntityStateSnapshot>>;

const DEFAULT_RUNTIME: HomeAssistantRuntimeValue = {
  status: "unconfigured",
  configured: false,
  canMutate: false,
  origin: null,
  error: null,
  areas: [],
  devices: [],
  entityRegistry: [],
  entityStates: EMPTY_STATES,
  connect: () => undefined,
  disconnect: async () => undefined,
  retry: () => undefined,
  refreshing: false,
  refreshError: null,
  refresh: async () => undefined,
  callService: async () => { throw new Error("Home Assistant is not connected."); },
  cameraClient: null,
};

export const HomeAssistantRuntimeContext = createContext<HomeAssistantRuntimeValue>(DEFAULT_RUNTIME);

export const useHomeAssistantRuntime = () => useContext(HomeAssistantRuntimeContext);

export function HomeAssistantRuntimeValueProvider({
  value,
  children,
}: {
  value: HomeAssistantRuntimeValue;
  children: ReactNode;
}) {
  return (
    <HomeAssistantRuntimeContext.Provider value={value}>
      {children}
    </HomeAssistantRuntimeContext.Provider>
  );
}

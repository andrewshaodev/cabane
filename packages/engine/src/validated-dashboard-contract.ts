import {
  type RuntimeBindingProfileManager
} from "./RuntimeBindingSetup";

import type {
  ArchitectureModelRegistry,
  DeviceModelRegistry,
  HomeManifest
} from "./types";

import type { EditorMode } from "./EditorModeIcon";
import type { ReactNode } from "react";

import { CabaneDashboardProps, DashboardMappingRequest, DashboardSessionPresentation, DashboardSetupAction } from "./dashboard-contract";

export interface ValidatedDashboardProps {
  manifest: HomeManifest;
  architectureModels: ArchitectureModelRegistry;
  deviceModels: DeviceModelRegistry;
  renderActionBarDeviceIcon?: (modelId: string) => ReactNode;
  bindingManager: RuntimeBindingProfileManager;
  fallbackDemo: boolean;
  sessionPresentation?: DashboardSessionPresentation;
  setupAction?: DashboardSetupAction;
  setupOpen: boolean;
  focusRoomId?: string;
  mappingRequest?: DashboardMappingRequest | null;
  onEditHome?: (mode?: EditorMode) => void;
  onCustomizeActionBar?: () => void;
  onExportBrowserData?: () => void;
  onHomeAssistantSettings?: () => void;
  onWorkspaces?: () => void;
  onOpenConnect?: (view: "rooms" | "devices", roomId?: string | null) => void;
  walkthrough?: CabaneDashboardProps["walkthrough"];
}

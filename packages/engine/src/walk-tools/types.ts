import type { ComponentType } from "react";
import type { ExtensionInteractionTarget } from "../types";

export interface WalkToolResult {
  status: "activated" | "unavailable";
  message: string;
}

/** Mounted inside the scene only while equipped in walk mode. No runtime credentials. */
export interface WalkToolProps {
  enabled: boolean;
  pointerLocked: boolean;
  coarsePointer: boolean;
  reducedMotion: boolean;
  canActivateTarget: (target: ExtensionInteractionTarget) => boolean;
  activateTarget: (target: ExtensionInteractionTarget) => Promise<WalkToolResult>;
}

/** Installed by the host; persisted shortcuts store only the stable tool ID. */
export interface WalkToolDefinition {
  id: string;
  label: string;
  /** Optional non-movement key, active only when this shortcut is on the bar. */
  shortcutKey?: string;
  Icon: ComponentType;
  Scene: ComponentType<WalkToolProps>;
}

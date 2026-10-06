import type {
  EntityId,
  RuntimeBindingProfile
} from "./types";

export const RUNTIME_BINDING_PROFILE_SCHEMA_VERSION = 1 as const;

export const RUNTIME_BINDING_PROFILE_STORAGE_PREFIX = "cabane.runtime-bindings.v1";

export const LEGACY_RUNTIME_BINDING_PROFILE_STORAGE_PREFIX = "smart-home-3d.runtime-bindings.v1";

export const entityDomain = (entityId: string) => entityId.split(".", 1)[0];

export interface BindingProfileValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface BindingProfileValidationResult {
  profile?: RuntimeBindingProfile;
  issues: readonly BindingProfileValidationIssue[];
  valid: boolean;
}

export interface BindingEntityCandidate {
  matchRank: number;
  entityId: EntityId;
  label: string;
  areaId: string | null;
  areaLabel: string;
  available: boolean;
  disabled: boolean;
  hidden: boolean;
  claimed: boolean;
  selectable: boolean;
  stateLabel: string;
}

export type BindingEntityCandidateScope = "mapped-area" | "all-areas";

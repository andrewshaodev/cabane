import { parseBuildTutorialState, type BuildTutorialState } from "./onboarding/build-tutorial-state";
import {
  allowsCrossAreaEntityBinding,
  collectBindingSlots,
  entityAreaId,
  entityMatchesBindingSlot,
} from "./runtime-binding-profile";
import type {
  HomeAssistantRuntimeSnapshot,
  HomeManifest,
  RuntimeBindingProfile,
} from "./types";
import { createLaunchOnboardingState, parseLaunchOnboardingState, returningLaunchOnboardingState, type LaunchOnboardingState } from "./onboarding/onboarding-state";

export const SETUP_RECORD_SCHEMA_VERSION = 2 as const;
export const SETUP_STORAGE_PREFIX = "cabane:onboarding:v2";
export const SETUP_COLLAPSE_SESSION_PREFIX = "cabane:onboarding-sheet:v1";

const CURRENT_LEGACY_ONBOARDING_PREFIX = "cabane:onboarding:v1";
const ORIGINAL_LEGACY_ONBOARDING_PREFIX = "smart-home-3d:onboarding:v1";
const CURRENT_LEGACY_MODELING_PREFIX = "cabane:modeling-nudge:v1";
const ORIGINAL_LEGACY_MODELING_PREFIX = "smart-home-3d:modeling-nudge:v1";

export type ConnectionSetupStage = "not-started" | "deferred" | "connected";
export type BuildSetupChoice = "not-started" | "construction" | "agents" | "deferred";

export interface SetupRecord {
  schemaVersion: typeof SETUP_RECORD_SCHEMA_VERSION;
  connectionStage: ConnectionSetupStage;
  buildChoice: BuildSetupChoice;
  activated: boolean;
  /** Optional only for compatibility with existing integrations and stored v2 records. */
  launch?: LaunchOnboardingState;
  buildTutorial?: BuildTutorialState;
}

export interface SetupRecordLoadResult {
  record: SetupRecord;
  durable: boolean;
  migrated: boolean;
  warning: string | null;
}

export interface SetupStepProgress {
  id: "home-assistant" | "modeling" | "room" | "device";
  complete: boolean;
  status: "complete" | "current" | "attention" | "deferred" | "pending";
}

export interface SetupProgress {
  steps: readonly SetupStepProgress[];
  completedCount: number;
  roomComplete: boolean;
  deviceComplete: boolean;
  deviceResolvedNow: boolean;
  activationReached: boolean;
  shouldPersistActivation: boolean;
  roomIdForDeviceMapping: string | null;
}

export interface SetupStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const CONNECTION_STAGES = new Set<ConnectionSetupStage>([
  "not-started",
  "deferred",
  "connected",
]);

const BUILD_CHOICES = new Set<BuildSetupChoice>([
  "not-started",
  "construction",
  "agents",
  "deferred",
]);

const LEGACY_MODELING_STAGES = new Set([
  "not-started",
  "floor-review",
  "floor-approved",
  "room-review",
  "complete",
  "floor-deferred",
  "room-deferred",
  "deferred",
]);

const CONTROLLABLE_DOMAINS = new Set([
  "light",
  "switch",
  "input_boolean",
  "climate",
  "cover",
  "fan",
  "media_player",
  "humidifier",
  "water_heater",
  "vacuum",
  "lock",
  "alarm_control_panel",
  "valve",
  "siren",
  "select",
  "number",
  "button",
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const createSetupRecord = (): SetupRecord => ({
  schemaVersion: SETUP_RECORD_SCHEMA_VERSION,
  connectionStage: "not-started",
  buildChoice: "not-started",
  activated: false,
  launch: createLaunchOnboardingState(),
});

export const setupStorageKey = (homeId: string) =>
  `${SETUP_STORAGE_PREFIX}:${homeId}`;

export const setupCollapseSessionKey = (homeId: string) =>
  `${SETUP_COLLAPSE_SESSION_PREFIX}:${homeId}`;

interface ParsedSetupRecord {
  record: SetupRecord;
  migrated: boolean;
}

const legacyBuildChoice = (stage: string): BuildSetupChoice => {
  if (["deferred", "floor-deferred", "room-deferred"].includes(stage)) return "deferred";
  if (["floor-review", "floor-approved", "room-review", "complete"].includes(stage)) return "agents";
  return "not-started";
};

const parseSetupRecord = (raw: string): ParsedSetupRecord | null => {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isObject(value) || typeof value.activated !== "boolean") return null;
    if (
      value.schemaVersion === SETUP_RECORD_SCHEMA_VERSION
      && typeof value.connectionStage === "string"
      && CONNECTION_STAGES.has(value.connectionStage as ConnectionSetupStage)
      && typeof value.buildChoice === "string"
      && BUILD_CHOICES.has(value.buildChoice as BuildSetupChoice)
    ) {
      const launch = value.launch === undefined ? returningLaunchOnboardingState() : parseLaunchOnboardingState(value.launch);
      if (!launch) return null;
      const buildTutorial = parseBuildTutorialState(value.buildTutorial);
      return {
        record: {
          schemaVersion: SETUP_RECORD_SCHEMA_VERSION,
          connectionStage: value.connectionStage as ConnectionSetupStage,
          buildChoice: value.buildChoice as BuildSetupChoice,
          activated: value.activated,
          launch,
          ...(buildTutorial ? { buildTutorial } : {}),
        },
        migrated: value.launch === undefined,
      };
    }
    if (
      value.schemaVersion === 1
      && typeof value.realSessionConnected === "boolean"
      && typeof value.modelingStage === "string"
      && LEGACY_MODELING_STAGES.has(value.modelingStage)
    ) {
      return {
        record: {
          schemaVersion: SETUP_RECORD_SCHEMA_VERSION,
          connectionStage: value.realSessionConnected ? "connected" : "not-started",
          buildChoice: legacyBuildChoice(value.modelingStage),
          activated: value.activated,
          launch: returningLaunchOnboardingState(),
        },
        migrated: true,
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const saveSetupRecord = (
  storage: SetupStorage,
  homeId: string,
  record: SetupRecord,
) => {
  try {
    storage.setItem(setupStorageKey(homeId), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

export const loadSetupRecord = (
  storage: SetupStorage,
  homeId: string,
): SetupRecordLoadResult => {
  try {
    const raw = storage.getItem(setupStorageKey(homeId));
    if (raw !== null) {
      const parsed = parseSetupRecord(raw);
      if (!parsed) {
        return {
          record: createSetupRecord(),
          durable: false,
          migrated: false,
          warning: "Setup progress could not be read and may not survive reload.",
        };
      }
      if (!parsed.migrated) {
        return { record: parsed.record, durable: true, migrated: false, warning: null };
      }
      const durable = saveSetupRecord(storage, homeId, parsed.record);
      return {
        record: parsed.record,
        durable,
        migrated: true,
        warning: durable ? null : "Setup progress could not be saved and may not survive reload.",
      };
    }

    const returningOwner = [
      `${CURRENT_LEGACY_ONBOARDING_PREFIX}:${homeId}`,
      `${ORIGINAL_LEGACY_ONBOARDING_PREFIX}:${homeId}`,
    ].some((key) => storage.getItem(key) === "complete");
    if (!returningOwner) {
      return { record: createSetupRecord(), durable: true, migrated: false, warning: null };
    }
    const modelingWasDismissed = [
      `${CURRENT_LEGACY_MODELING_PREFIX}:${homeId}`,
      `${ORIGINAL_LEGACY_MODELING_PREFIX}:${homeId}`,
    ].some((key) => storage.getItem(key) === "complete");

    const record: SetupRecord = {
      schemaVersion: SETUP_RECORD_SCHEMA_VERSION,
      connectionStage: "connected",
      buildChoice: modelingWasDismissed ? "deferred" : "not-started",
      activated: true,
      launch: returningLaunchOnboardingState(),
    };
    const durable = saveSetupRecord(storage, homeId, record);
    return {
      record,
      durable,
      migrated: true,
      warning: durable ? null : "Setup progress could not be saved and may not survive reload.",
    };
  } catch {
    return {
      record: createSetupRecord(),
      durable: false,
      migrated: false,
      warning: "Setup progress could not be read and may not survive reload.",
    };
  }
};

export const loadSetupCollapsed = (storage: Pick<SetupStorage, "getItem">, homeId: string) => {
  try {
    return storage.getItem(setupCollapseSessionKey(homeId)) === "collapsed";
  } catch {
    return false;
  }
};

export const saveSetupCollapsed = (
  storage: SetupStorage,
  homeId: string,
  collapsed: boolean,
) => {
  try {
    storage.setItem(setupCollapseSessionKey(homeId), collapsed ? "collapsed" : "open");
    return true;
  } catch {
    return false;
  }
};

const validMappedRoomIds = (
  manifest: HomeManifest,
  runtime: HomeAssistantRuntimeSnapshot,
  profile: RuntimeBindingProfile,
) => {
  const roomIds = new Set(manifest.floors.flatMap((floor) => floor.rooms).map((room) => room.id) ?? []);
  const areaIds = new Set(runtime.areas.map((area) => area.area_id));
  const counts = new Map<string, number>();
  Object.values(profile.roomAreaIds).forEach((areaId) => {
    counts.set(areaId, (counts.get(areaId) ?? 0) + 1);
  });
  return new Set(Object.entries(profile.roomAreaIds)
    .filter(([roomId, areaId]) => (
      roomIds.has(roomId)
      && areaIds.has(areaId)
      && counts.get(areaId) === 1
    ))
    .map(([roomId]) => roomId));
};

const resolvedControllableRoomId = (
  manifest: HomeManifest,
  runtime: HomeAssistantRuntimeSnapshot,
  profile: RuntimeBindingProfile,
  mappedRoomIds: ReadonlySet<string>,
) => {
  if (runtime.status !== "connected" || !runtime.canMutate) return null;
  const entityCounts = new Map<string, number>();
  Object.values(profile.entityIdsBySlotId).forEach((entityId) => {
    entityCounts.set(entityId, (entityCounts.get(entityId) ?? 0) + 1);
  });
  const entries = new Map(runtime.entityRegistry.map((entry) => [entry.entity_id, entry]));
  const descriptors = new Map(collectBindingSlots(manifest).map((descriptor) => [descriptor.slotId, descriptor]));

  for (const room of manifest.floors.flatMap((floor) => floor.rooms) ?? []) {
    if (!mappedRoomIds.has(room.id)) continue;
    const expectedAreaId = profile.roomAreaIds[room.id];
    for (const device of room.devices) {
      const primary = device.entitySlots.find((slot) => slot.deviceRole === "primary");
      if (!primary) continue;
      const entityId = profile.entityIdsBySlotId[primary.id];
      const entry = entityId ? entries.get(entityId) : undefined;
      const state = entityId ? runtime.entityStates[entityId] : undefined;
      const descriptor = descriptors.get(primary.id);
      const domain = entityId?.split(".", 1)[0];
      if (
        !entityId
        || !entry
        || !state
        || !descriptor
        || entityCounts.get(entityId) !== 1
        || entry.disabled_by !== null
        || Boolean(entry.hidden_by)
        || (
          !allowsCrossAreaEntityBinding(manifest, descriptor)
          && entityAreaId(entry, runtime) !== expectedAreaId
        )
        || !entityMatchesBindingSlot(descriptor, entityId, runtime)
        || !domain
        || !CONTROLLABLE_DOMAINS.has(domain)
        || !state.available
        || state.stale
      ) continue;
      return room.id;
    }
  }
  return null;
};

export const deriveSetupProgress = ({
  manifest,
  runtime,
  profile,
  record,
}: {
  manifest: HomeManifest;
  runtime: HomeAssistantRuntimeSnapshot;
  profile: RuntimeBindingProfile;
  record: SetupRecord;
}): SetupProgress => {
  const mappedRoomIds = validMappedRoomIds(manifest, runtime, profile);
  const roomIdForDeviceMapping = [...mappedRoomIds][0] ?? null;
  const resolvedRoomId = resolvedControllableRoomId(manifest, runtime, profile, mappedRoomIds);
  const roomResolvedNow = mappedRoomIds.size > 0;
  const roomComplete = record.activated || roomResolvedNow;
  const deviceResolvedNow = resolvedRoomId !== null;
  const deviceComplete = record.activated || deviceResolvedNow;
  const activationReached = record.activated
    || (record.connectionStage === "connected" && roomComplete && deviceResolvedNow);
  const buildComplete = ["construction", "agents"].includes(record.buildChoice);
  const buildResolved = buildComplete || record.buildChoice === "deferred";
  const connectionResolved = record.connectionStage !== "not-started";
  const connectionNeedsAttention = record.connectionStage === "connected"
    && ["disconnected", "auth-expired", "error"].includes(runtime.status);

  const steps: SetupStepProgress[] = [
    {
      id: "home-assistant",
      complete: record.connectionStage === "connected",
      status: connectionNeedsAttention
        ? "attention"
        : record.connectionStage === "connected"
          ? "complete"
          : record.connectionStage === "deferred" ? "deferred" : "current",
    },
    {
      id: "modeling",
      complete: buildComplete,
      status: buildComplete
        ? "complete"
        : record.buildChoice === "deferred"
          ? "deferred"
          : connectionResolved ? "current" : "pending",
    },
    {
      id: "room",
      complete: roomComplete,
      status: roomComplete
        ? "complete"
        : record.connectionStage === "connected" && buildResolved ? "current" : "pending",
    },
    {
      id: "device",
      complete: deviceComplete,
      status: deviceComplete ? "complete" : roomComplete ? "current" : "pending",
    },
  ];

  return {
    steps,
    completedCount: steps.filter((step) => step.complete).length,
    roomComplete,
    deviceComplete,
    deviceResolvedNow,
    activationReached,
    shouldPersistActivation: activationReached && !record.activated,
    roomIdForDeviceMapping: resolvedRoomId ?? roomIdForDeviceMapping,
  };
};

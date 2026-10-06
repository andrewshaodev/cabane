import {
  loadStoredHomeAssistantUrl,
  normalizeHomeAssistantUrl,
  saveStoredHomeAssistantUrl,
} from "./home-assistant-auth";
import {
  draftFloorLayoutStorageKey,
  legacyDraftFloorLayoutStorageKey,
  loadActiveFloorLayout,
  parseFloorLayoutDraft,
  saveActiveFloorLayout,
  saveFloorLayoutDraft,
} from "./home-project/legacy-floor-storage";
import {
  loadRuntimeBindingProfile,
  saveRuntimeBindingProfile,
  validateRuntimeBindingProfile,
} from "./runtime-binding-profile";
import type { FloorEditorDraft } from "./home-editor/construct/editor-state";
import type { FloorSpec, HomeManifest, RuntimeBindingProfile } from "./types";
import { validateLayoutFloorSpec } from "./home-editor/construct/layout-validation";
import { composeManifestWithBrowserFloor } from "./home-project/legacy-floor-runtime";

export const CABANE_BROWSER_DATA_SCHEMA_VERSION = 1 as const;
export const CABANE_BROWSER_DATA_TYPE = "cabane-browser-data" as const;

export interface CabaneBrowserDataTransfer {
  type: typeof CABANE_BROWSER_DATA_TYPE;
  schemaVersion: typeof CABANE_BROWSER_DATA_SCHEMA_VERSION;
  homeId: string;
  homeAssistantUrl?: string;
  runtimeBindingProfile?: RuntimeBindingProfile;
  activeFloor?: FloorSpec;
  floorDraft?: FloorEditorDraft;
}

export interface BrowserDataTransferIssue {
  code: string;
  path: string;
  message: string;
}

export interface BrowserDataImportResult {
  valid: boolean;
  issues: readonly BrowserDataTransferIssue[];
  imported?: {
    homeAssistantUrl: boolean;
    runtimeBindingProfile: boolean;
    activeFloor: boolean;
    floorDraft: boolean;
  };
}

type BrowserStorageReader = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type BrowserStorageWriter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const exportCabaneBrowserData = (storage: BrowserStorageReader, manifest: HomeManifest) => {
  const homeAssistantUrl = loadStoredHomeAssistantUrl(storage);
  const runtimeBindingProfile = homeAssistantUrl
    ? (loadRuntimeBindingProfile(storage, homeAssistantUrl, manifest) ?? undefined)
    : undefined;
  const active = loadActiveFloorLayout(storage, manifest.home.id);
  const activeFloor = active.status === "valid" ? active.floor : undefined;
  const draftRaw =
    storage.getItem(draftFloorLayoutStorageKey(manifest.home.id)) ??
    storage.getItem(legacyDraftFloorLayoutStorageKey(manifest.home.id));
  const floorDraft = draftRaw
    ? (parseFloorLayoutDraft(draftRaw, activeFloor?.id ?? manifest.floors[0].id) ?? undefined)
    : undefined;
  const transfer: CabaneBrowserDataTransfer = {
    type: CABANE_BROWSER_DATA_TYPE,
    schemaVersion: CABANE_BROWSER_DATA_SCHEMA_VERSION,
    homeId: manifest.home.id,
    ...(homeAssistantUrl ? { homeAssistantUrl } : {}),
    ...(runtimeBindingProfile ? { runtimeBindingProfile } : {}),
    ...(activeFloor ? { activeFloor } : {}),
    ...(floorDraft ? { floorDraft } : {}),
  };
  return `${JSON.stringify(transfer, null, 2)}\n`;
};

const validateTransfer = (
  input: unknown,
  manifest: HomeManifest,
): { transfer?: CabaneBrowserDataTransfer; issues: BrowserDataTransferIssue[] } => {
  const issues: BrowserDataTransferIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!isObject(input)) {
    add("transfer.type", "$", "The selected file must contain a Cabane browser-data object.");
    return { issues };
  }
  if (input.type !== CABANE_BROWSER_DATA_TYPE) {
    add("transfer.type", "type", "This is not a Cabane browser-data export.");
  }
  if (input.schemaVersion !== CABANE_BROWSER_DATA_SCHEMA_VERSION) {
    add("transfer.schema", "schemaVersion", "This Cabane browser-data version is not supported.");
  }
  if (input.homeId !== manifest.home.id) {
    add(
      "transfer.home",
      "homeId",
      `This export belongs to a different home, not "${manifest.home.id}".`,
    );
  }

  let homeAssistantUrl: string | undefined;
  if (input.homeAssistantUrl !== undefined) {
    homeAssistantUrl =
      typeof input.homeAssistantUrl === "string"
        ? (normalizeHomeAssistantUrl(input.homeAssistantUrl) ?? undefined)
        : undefined;
    if (!homeAssistantUrl)
      add("transfer.ha-url", "homeAssistantUrl", "The Home Assistant URL is invalid.");
  }

  let activeFloor: FloorSpec | undefined;
  if (input.activeFloor !== undefined) {
    const result = validateLayoutFloorSpec(input.activeFloor);
    if (!result.valid || !result.floor) {
      for (const issue of result.issues) {
        add(`transfer.${issue.code}`, `activeFloor.${issue.path}`, issue.message);
      }
    } else {
      activeFloor = result.floor;
    }
  }

  let runtimeBindingProfile: RuntimeBindingProfile | undefined;
  if (input.runtimeBindingProfile !== undefined) {
    if (!homeAssistantUrl) {
      add(
        "transfer.profile-origin",
        "runtimeBindingProfile",
        "A binding profile requires a valid Home Assistant URL.",
      );
    }
    let profileManifest = manifest;
    if (activeFloor) {
      try {
        profileManifest = composeManifestWithBrowserFloor(manifest, activeFloor);
      } catch (error) {
        add(
          "transfer.floor-building",
          "activeFloor",
          error instanceof Error ? error.message : "The floor does not fit this building.",
        );
      }
    }
    const result = validateRuntimeBindingProfile(input.runtimeBindingProfile, profileManifest);
    if (!result.valid || !result.profile) {
      for (const issue of result.issues) {
        add(`transfer.${issue.code}`, `runtimeBindingProfile.${issue.path}`, issue.message);
      }
    } else {
      runtimeBindingProfile = result.profile;
    }
  }

  let floorDraft: FloorEditorDraft | undefined;
  if (input.floorDraft !== undefined) {
    const raw = JSON.stringify(input.floorDraft);
    floorDraft = parseFloorLayoutDraft(raw, activeFloor?.id ?? manifest.floors[0].id) ?? undefined;
    if (!floorDraft)
      add("transfer.floor-draft", "floorDraft", "The saved floor draft is invalid for this home.");
  }

  if (issues.length > 0) return { issues };
  return {
    issues,
    transfer: {
      type: CABANE_BROWSER_DATA_TYPE,
      schemaVersion: CABANE_BROWSER_DATA_SCHEMA_VERSION,
      homeId: manifest.home.id,
      ...(homeAssistantUrl ? { homeAssistantUrl } : {}),
      ...(runtimeBindingProfile ? { runtimeBindingProfile } : {}),
      ...(activeFloor ? { activeFloor } : {}),
      ...(floorDraft ? { floorDraft } : {}),
    },
  };
};

export const importCabaneBrowserData = (
  json: string,
  storage: BrowserStorageWriter,
  manifest: HomeManifest,
): BrowserDataImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      issues: [
        {
          code: "transfer.json",
          path: "$",
          message: "The selected Cabane browser-data file is not valid JSON.",
        },
      ],
    };
  }
  const validation = validateTransfer(parsed, manifest);
  if (!validation.transfer) return { valid: false, issues: validation.issues };
  const transfer = validation.transfer;
  try {
    if (transfer.activeFloor)
      saveActiveFloorLayout(storage, manifest.home.id, transfer.activeFloor);
    if (transfer.floorDraft) saveFloorLayoutDraft(storage, manifest.home.id, transfer.floorDraft);
    if (transfer.runtimeBindingProfile && transfer.homeAssistantUrl) {
      saveRuntimeBindingProfile(storage, transfer.homeAssistantUrl, transfer.runtimeBindingProfile);
    }
    if (transfer.homeAssistantUrl) {
      saveStoredHomeAssistantUrl(storage, transfer.homeAssistantUrl);
      if (loadStoredHomeAssistantUrl(storage) !== transfer.homeAssistantUrl) {
        throw new Error("The browser did not retain the imported Home Assistant URL.");
      }
    }
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          code: "transfer.storage",
          path: "$",
          message:
            error instanceof Error
              ? error.message
              : "The browser could not store the imported data.",
        },
      ],
    };
  }
  return {
    valid: true,
    issues: [],
    imported: {
      homeAssistantUrl: Boolean(transfer.homeAssistantUrl),
      runtimeBindingProfile: Boolean(transfer.runtimeBindingProfile),
      activeFloor: Boolean(transfer.activeFloor),
      floorDraft: Boolean(transfer.floorDraft),
    },
  };
};

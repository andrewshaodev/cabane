import { exportPrivateWorkspaceRecord, parseWorkspaceImport } from "../workspaces/workspace-transfer";
import {
  collectBindingSlots, createEmptyRuntimeBindingProfile, exportRuntimeBindingProfile,
  normalizeWorkspaceBindingOrigin, validateRuntimeBindingProfile, validateWorkspaceBindings,
  composeHomeBindingManifest, reconcileWorkspaceBindings,
  type HomeBindingManifest, type HomeProjectRecord, type WorkspaceBindings, type ProjectModelRegistries,
} from "@cabane/engine";

export function stageImportedProfile(bindings: WorkspaceBindings, origin: string, json: string, manifest: HomeBindingManifest): WorkspaceBindings {
  const key = normalizeWorkspaceBindingOrigin(origin);
  const input: unknown = JSON.parse(json);
  const result = validateRuntimeBindingProfile(input, manifest);
  if (!result.valid || !result.profile) throw new Error(result.issues[0]?.message ?? "Invalid profile.");
  // Validate the original shape too: transfer must not silently accept secrets.
  const candidate = { ...bindings, [key]: {
    draft: input as typeof result.profile,
    published: bindings[key]?.published ?? createEmptyRuntimeBindingProfile(manifest.home.id),
    manualRoomIds: manifest.floors.flatMap((floor) => floor.rooms).map((room) => room.id),
    manualSlotIds: collectBindingSlots(manifest).map((slot) => slot.slotId),
  } };
  const issues = validateWorkspaceBindings({ [key]: { ...candidate[key], published: result.profile } }, manifest, manifest);
  if (issues.length) throw new Error(issues[0].message);
  return candidate;
}

export function stageImportedWorkspace(record: HomeProjectRecord, json: string, registries: ProjectModelRegistries) {
  const parsed = parseWorkspaceImport(json, registries);
  if (parsed.record.homeId !== record.homeId) throw new Error("This backup belongs to another home.");
  const project = parsed.record.draft;
  const manifest = composeHomeBindingManifest(project, { furnishingModels: {}, deviceModels: {}, openingModels: {} });
  const retained = reconcileWorkspaceBindings(record.bindings, manifest);
  const bindings = { ...retained, ...Object.fromEntries(Object.entries(parsed.record.bindings).map(([origin, state]) => [origin, {
    ...state, published: record.bindings[origin]?.published ?? createEmptyRuntimeBindingProfile(record.homeId),
    manualRoomIds: manifest.floors.flatMap((floor) => floor.rooms).map((room) => room.id), manualSlotIds: collectBindingSlots(manifest).map((slot) => slot.slotId),
  }])) };
  return { project, bindings };
}

export function exportPublishedProfile(bindings: WorkspaceBindings, origin: string, homeId: string) {
  return exportRuntimeBindingProfile(bindings[normalizeWorkspaceBindingOrigin(origin)]?.published ?? createEmptyRuntimeBindingProfile(homeId));
}

export function exportPrivateWorkspace(record: HomeProjectRecord) {
  return exportPrivateWorkspaceRecord(record);
}

export function downloadConnectData(contents: string, filename: string) {
  const href = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = href; anchor.download = filename; anchor.click(); URL.revokeObjectURL(href);
}

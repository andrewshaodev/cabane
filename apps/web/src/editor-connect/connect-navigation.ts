import { deviceMappingRooms, groupRoomMappingRelationships, type HomeBindingManifest } from "@cabane/engine";

export interface EditorCameraState {
  view: "3d" | "top";
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface EditorOpenRequest {
  floorId?: string;
  mode: "construct" | "furnish" | "connect";
  panel?: "action-bar";
  view?: "rooms" | "devices";
  roomId?: string | null;
  relationshipId?: string | null;
  arrange?: { selectedItemId: string | null; camera?: EditorCameraState };
}

export type EditorReturnRequest = EditorOpenRequest & { workspaceId: string };

export const CONNECT_RETURN_KEY = "cabane:editor-return:v1";

export function deviceRoom(manifest: HomeBindingManifest, deviceId: string) {
  return deviceMappingRooms(manifest).find((room) => groupRoomMappingRelationships(manifest, room.id).some((group) => group.relationships.some((relationship) => relationship.id === deviceId)));
}

/** Only local navigation identifiers and finite camera coordinates cross OAuth. */
export function parseEditorReturn(raw: string | null, workspaceId?: string): EditorReturnRequest | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || value.mode !== "connect" || typeof value.workspaceId !== "string" || !value.workspaceId.trim() || (workspaceId !== undefined && value.workspaceId !== workspaceId)) return null;
    const request: EditorReturnRequest = {
      workspaceId: value.workspaceId,
      ...(typeof value.floorId === "string" ? { floorId: value.floorId } : {}),
      mode: "connect", view: value.view === "devices" ? "devices" : "rooms",
      roomId: typeof value.roomId === "string" ? value.roomId : null,
      relationshipId: typeof value.relationshipId === "string" ? value.relationshipId : null,
    };
    if (value.arrange && typeof value.arrange === "object") {
      request.arrange = { selectedItemId: typeof value.arrange.selectedItemId === "string" ? value.arrange.selectedItemId : null };
      const camera = value.arrange.camera;
      const point = (v: unknown) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n));
      if (camera && ["3d", "top"].includes(camera.view) && point(camera.position) && point(camera.target)
        && typeof camera.zoom === "number" && Number.isFinite(camera.zoom) && camera.zoom >= 8 && camera.zoom <= 180) {
        request.arrange.camera = { view: camera.view, position: camera.position, target: camera.target, zoom: camera.zoom };
      }
    }
    return request;
  } catch { return null; }
}

export function readEditorReturn(workspaceId?: string): EditorReturnRequest | null {
  try { return typeof window === "undefined" ? null : parseEditorReturn(window.sessionStorage.getItem(CONNECT_RETURN_KEY), workspaceId); }
  catch { return null; }
}

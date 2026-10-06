import { useEffect, useMemo, useRef, useState } from "react";
import {
  deviceMappingRooms,
  automaticallyMapRuntimeBindings,
  createEmptyRuntimeBindingProfile,
  groupRoomMappingRelationships,
  normalizeWorkspaceBindingOrigin,
  replaceRoomAreaMapping,
  saveRoomAreaDraft,
  validateRuntimeBindingProfile,
  type HomeAssistantRuntimeValue,
  type HomeBindingManifest,
  type HomeProjectIssue,
  type RuntimeBindingProfile,
  type WorkspaceBindings,
} from "@cabane/engine";
import { stageImportedProfile } from "./profile-transfer";
import { deviceRoom, type EditorOpenRequest } from "./connect-navigation";
export type { EditorOpenRequest } from "./connect-navigation";

export function useConnectEditor({
  manifest,
  bindings,
  runtime,
  origin,
  active,
  onChange,
  initialRequest,
  routeView,
  onViewChange,
  floorId,
}: {
  manifest: HomeBindingManifest;
  floorId?: string;
  bindings: WorkspaceBindings;
  runtime: HomeAssistantRuntimeValue;
  origin: string | null;
  active: boolean;
  onChange: (bindings: WorkspaceBindings) => void;
  initialRequest?: EditorOpenRequest;
  routeView?: "rooms" | "devices";
  onViewChange?: (view: "rooms" | "devices") => void;
}) {
  const key = origin ? normalizeWorkspaceBindingOrigin(origin) : null;
  const empty = useMemo(
    () => createEmptyRuntimeBindingProfile(manifest.home.id),
    [manifest.home.id],
  );
  const state = key ? bindings[key] : undefined;
  const profile = state?.draft ?? empty;
  const rooms =
    (manifest.floors.find((floor) => floor.id === floorId) ?? manifest.floors[0])?.rooms ?? [];
  const hasUnmappedRooms = rooms.some((room) => !profile.roomAreaIds[room.id]);
  const defaultView: "rooms" | "devices" =
    rooms.length > 0 && !hasUnmappedRooms ? "devices" : "rooms";
  const [localView, setLocalView] = useState<"rooms" | "devices">(
    initialRequest?.relationshipId ? "devices" : (initialRequest?.view ?? defaultView),
  );
  const view = onViewChange ? (routeView ?? defaultView) : localView;
  const setView = (next: "rooms" | "devices") => {
    setLocalView(next);
    onViewChange?.(next);
  };
  const [roomId, setRoomId] = useState<string | null>(
    () =>
      (initialRequest?.relationshipId
        ? deviceRoom(manifest, initialRequest.relationshipId)?.id
        : null) ??
      initialRequest?.roomId ??
      null,
  );
  const [relationshipId, setRelationshipId] = useState<string | null>(
    initialRequest?.relationshipId ?? null,
  );
  const [pendingAreaChange, setPendingAreaChange] = useState<ReturnType<
    typeof saveRoomAreaDraft
  > | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const disconnected = runtime.status !== "connected" || runtime.origin !== key;
  const cache = useRef<{ origin: string; runtime: HomeAssistantRuntimeValue } | null>(null);
  if (!disconnected && key) cache.current = { origin: key, runtime };
  const displayRuntime =
    disconnected && cache.current?.origin === key ? cache.current.runtime : runtime;
  const deviceRooms = deviceMappingRooms(manifest, floorId ?? manifest.floors[0]?.id);
  const room = deviceRooms.find((candidate) => candidate.id === roomId) ?? null;
  const groupsByRoom = useMemo(
    () =>
      Object.fromEntries(
        deviceRooms.map((candidate) => [
          candidate.id,
          groupRoomMappingRelationships(manifest, candidate.id),
        ]),
      ),
    [manifest, floorId],
  );
  const groups = room ? groupsByRoom[room.id] : [];
  const roomDeviceSummaries = useMemo(
    () =>
      Object.fromEntries(
        rooms.map((candidate) => {
          // Optional opening contacts should not make the room look unfinished.
          const categories = groupsByRoom[candidate.id]
            .map((group) => ({
              ...group,
              relationships: group.relationships.filter(
                (relationship) =>
                  relationship.kind !== "entity-slot" ||
                  (relationship.slotKind !== "opening-contact" &&
                    relationship.slotKind !== "opening-cover") ||
                  relationship.slotIds.some((id) => Boolean(profile.entityIdsBySlotId[id])),
              ),
            }))
            .filter((group) => group.relationships.length > 0);
          const relationships = categories.flatMap((group) => group.relationships);
          return [
            candidate.id,
            {
              // Count each device/control once, even when it has several mapped functions.
              mapped: relationships.filter((relationship) =>
                relationship.slotIds.some((id) => Boolean(profile.entityIdsBySlotId[id])),
              ).length,
              total: relationships.length,
              categories,
            },
          ];
        }),
      ),
    [groupsByRoom, profile.entityIdsBySlotId],
  );
  const relationship =
    groups
      .flatMap((group) => group.relationships)
      .find((candidate) => candidate.id === relationshipId) ?? null;
  const current = useRef({
    manifest,
    bindings,
    state,
    profile,
    onChange,
    key,
    runtime,
    disconnected,
  });
  current.current = { manifest, bindings, state, profile, onChange, key, runtime, disconnected };
  useEffect(() => {
    if (initialRequest?.relationshipId) {
      setRoomId(
        deviceRoom(manifest, initialRequest.relationshipId)?.id ?? initialRequest.roomId ?? null,
      );
      setRelationshipId(initialRequest.relationshipId);
    } else if (initialRequest?.roomId) setRoomId(initialRequest.roomId);
  }, [initialRequest]);

  const commitProfile = (
    next: RuntimeBindingProfile,
    manualRoomIds: readonly string[] = [],
    manualSlotIds: readonly string[] = [],
  ) => {
    const latest = current.current;
    if (!latest.key) return;
    latest.onChange({
      ...latest.bindings,
      [latest.key]: {
        draft: next,
        published: latest.state?.published ?? empty,
        manualRoomIds: [...new Set([...(latest.state?.manualRoomIds ?? []), ...manualRoomIds])],
        manualSlotIds: [...new Set([...(latest.state?.manualSlotIds ?? []), ...manualSlotIds])],
      },
    });
    setMessage("Draft changes");
  };
  // History edits are deliberately absent from this trigger. Undo must stay undone.
  const entryKey = JSON.stringify([
    key,
    manifest,
    runtime.areas,
    runtime.devices,
    runtime.entityRegistry,
  ]);
  const lastAutomaticEntry = useRef<string | null>(null);
  useEffect(() => {
    const latest = current.current;
    if (!active || latest.disconnected || !latest.key) return;
    if (lastAutomaticEntry.current === entryKey) return;
    lastAutomaticEntry.current = entryKey;
    const result = automaticallyMapRuntimeBindings(
      latest.manifest,
      latest.profile,
      latest.runtime,
      latest.state,
    );
    if (result.applied.length) commitProfile(result.profile);
  }, [entryKey, active, disconnected]);
  useEffect(() => {
    if (relationshipId && !relationship) {
      const currentRoom = deviceRoom(manifest, relationshipId);
      if (currentRoom) {
        setRoomId(currentRoom.id);
        return;
      }
      setMessage("This device is no longer in the draft. Select another device to connect.");
      setRelationshipId(null);
    }
    if (!room) setRoomId(null);
  }, [manifest, room, relationship, relationshipId]);

  const issues: HomeProjectIssue[] = validateRuntimeBindingProfile(
    profile,
    manifest,
    disconnected ? undefined : runtime,
  ).issues.map((issue) => ({
    ...issue,
    severity: ["profile.area-missing", "profile.entity-missing", "profile.device-class"].includes(
      issue.code,
    )
      ? "warning"
      : "error",
  }));
  if (
    disconnected &&
    (Object.keys(profile.roomAreaIds).length || Object.keys(profile.entityIdsBySlotId).length)
  ) {
    issues.push({
      code: "connect.offline",
      path: "bindings",
      message:
        "Home Assistant is offline. Saved connections will be retained without registry verification.",
      severity: "warning",
    });
  }
  return {
    view,
    defaultView,
    hasUnmappedRooms,
    setView: (next: "rooms" | "devices") => {
      setView(next);
      setRelationshipId(null);
      if (next === "rooms" && !rooms.some((candidate) => candidate.id === roomId)) setRoomId(null);
    },
    rooms,
    deviceRooms,
    roomId: room?.id ?? null,
    room,
    selectRoom: (id: string) => {
      setRoomId(id);
      setRelationshipId(null);
      setPendingAreaChange(null);
    },
    relationshipId,
    relationship,
    selectRelationship: setRelationshipId,
    groups,
    roomDeviceSummaries,
    profile,
    selectDevice: (id: string) => {
      const destination = deviceRoom(manifest, id);
      setView("devices");
      setPendingAreaChange(null);
      if (!destination) {
        setRelationshipId(null);
        setMessage("This device is no longer in the draft. Select another device to connect.");
        return false;
      }
      setRoomId(destination.id);
      setRelationshipId(id);
      setMessage(null);
      return true;
    },
    publishedProfile: state?.published ?? empty,
    displayRuntime,
    disconnected,
    issues,
    message,
    pendingAreaChange,
    assignArea: (areaId: string) => {
      if (!room || !key || (disconnected && areaId)) return;
      if (
        areaId &&
        (!runtime.areas.some((area) => area.area_id === areaId) ||
          Object.entries(profile.roomAreaIds).some(
            ([id, assigned]) => id !== room.id && assigned === areaId,
          ))
      )
        return;
      const next = replaceRoomAreaMapping(profile, room.id, areaId || null);
      const proposed = saveRoomAreaDraft({
        manifest,
        savedProfile: profile,
        roomAreaIds: next.roomAreaIds,
      });
      if (proposed.clearedSlotIds.length) setPendingAreaChange(proposed);
      else commitProfile(proposed.profile, [room.id]);
    },
    confirmAreaChange: () => {
      if (!pendingAreaChange) return;
      commitProfile(
        pendingAreaChange.profile,
        pendingAreaChange.changedRoomIds,
        pendingAreaChange.clearedSlotIds,
      );
      setPendingAreaChange(null);
    },
    cancelAreaChange: () => setPendingAreaChange(null),
    assignEntities: (entityIdsBySlotId: RuntimeBindingProfile["entityIdsBySlotId"]) => {
      const changed = [
        ...new Set([...Object.keys(profile.entityIdsBySlotId), ...Object.keys(entityIdsBySlotId)]),
      ].filter((id) => profile.entityIdsBySlotId[id] !== entityIdsBySlotId[id]);
      if (disconnected && changed.some((id) => entityIdsBySlotId[id])) return;
      commitProfile(
        { ...profile, entityIdsBySlotId },
        [],
        [...changed, ...(relationship?.slotIds ?? [])],
      );
    },
    refresh: async () => {
      if (disconnected) return;
      try {
        await runtime.refresh();
      } catch {
        setMessage("Refresh failed. Your draft choices are unchanged.");
      }
    },
    importProfile: (json: string) => {
      if (!key) throw new Error("Set a Home Assistant address before importing a profile.");
      onChange(stageImportedProfile(bindings, key, json, manifest));
      setMessage("Connections imported into the draft. Save to activate them.");
    },
  };
}

export type ConnectEditor = ReturnType<typeof useConnectEditor>;

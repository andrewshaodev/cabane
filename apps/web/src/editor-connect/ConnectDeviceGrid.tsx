import { useMemo } from "react";
import {
  DeviceCategoryIcon,
  DeviceMappingGroup,
  EntitySlotMappingRow,
  ModeledDeviceMappingRow,
  type DeviceMappingRelationship,
  type DeviceModelRegistry,
  type HomeBindingManifest,
} from "@cabane/engine";
import type { ConnectEditor } from "./useConnectEditor";
import { ModelThumbnail } from "../editor-preview/furnish/catalog/ModelThumbnailRenderer";
import type { ModelPreviewEntry } from "../editor-preview/furnish/catalog/model-preview-entry";
import { openingPreviewEntry } from "../editor-preview/openings/opening-preview-entry";

export function ConnectDevicePreview({
  relationship,
  models,
  manifest,
  selected = false,
}: {
  relationship: DeviceMappingRelationship;
  models: DeviceModelRegistry;
  manifest: HomeBindingManifest;
  selected?: boolean;
}) {
  const definition =
    relationship.kind === "modeled-device" ? models[relationship.device.model] : undefined;
  const modelId = relationship.kind === "modeled-device" ? relationship.device.model : "";
  const openingId =
    relationship.kind === "entity-slot" ? relationship.descriptor.openingId : undefined;
  const entry = useMemo<ModelPreviewEntry | null>(
    () =>
      openingId
        ? openingPreviewEntry(manifest, openingId)
        : definition
          ? { key: `device:${modelId}`, kind: "device", modelId, definition }
          : null,
    [definition, modelId, manifest, openingId],
  );
  const domain =
    relationship.kind === "modeled-device"
      ? (relationship.device.entitySlots.find((slot) => slot.deviceRole === "primary")
          ?.compatibleDomains[0] ?? relationship.device.entitySlots[0]?.compatibleDomains[0])
      : relationship.descriptor.spec.compatibleDomains[0];
  const fallback = <DeviceCategoryIcon domain={domain ?? "unknown"} size={30} />;
  return (
    <span
      className={`connect-device-preview${selected ? " is-selected-preview" : ""}`}
      aria-hidden="true"
    >
      {entry ? (
        <ModelThumbnail entry={entry} showAdd={false} fallback={fallback} />
      ) : (
        <span className="connect-device-preview__icon">{fallback}</span>
      )}
    </span>
  );
}

export function ConnectDeviceGrid({
  editor,
  manifest,
  models,
  onOpen,
  onTrigger,
}: {
  editor: ConnectEditor;
  manifest: HomeBindingManifest;
  models: DeviceModelRegistry;
  onOpen: (id: string) => void;
  onTrigger: (id: string, element: HTMLButtonElement | null) => void;
}) {
  if (!editor.room) return null;
  return (
    <div className="connect-device-grid">
      {editor.groups.map((group) => (
        <DeviceMappingGroup key={group.id} group={group}>
          {group.relationships.map((relationship) => {
            const props = {
              room: editor.room!,
              profile: editor.profile,
              runtime: editor.displayRuntime,
              disabled: false,
              selected: false,
              onOpen: () => onOpen(relationship.id),
              onTriggerElement: (element: HTMLButtonElement | null) =>
                onTrigger(relationship.id, element),
              preview: (
                <ConnectDevicePreview
                  relationship={relationship}
                  models={models}
                  manifest={manifest}
                />
              ),
            };
            return relationship.kind === "modeled-device" ? (
              <ModeledDeviceMappingRow
                key={relationship.id}
                {...props}
                manifest={manifest}
                device={relationship.device}
              />
            ) : (
              <EntitySlotMappingRow
                key={relationship.id}
                {...props}
                descriptor={relationship.descriptor}
              />
            );
          })}
        </DeviceMappingGroup>
      ))}
      {editor.groups.length === 0 && (
        <p className="connect-empty">
          This room has no devices or controls to connect. Add a device in Arrange to get started.
        </p>
      )}
    </div>
  );
}

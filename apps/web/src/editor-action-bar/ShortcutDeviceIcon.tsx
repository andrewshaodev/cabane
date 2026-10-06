import { useMemo, useRef, type ReactNode } from "react";
import type { DeviceModelRegistry } from "@cabane/engine";
import { ModelThumbnail, ModelThumbnailRenderer } from "../editor-preview/furnish/catalog/ModelThumbnailRenderer";
import type { ModelPreviewEntry } from "../editor-preview/furnish/catalog/model-preview-entry";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import "../editor-preview/furnish/catalog/arrange-catalog.css";

/** Home and Shortcuts use the same queued, cached model preview as Arrange. */
export function ShortcutThumbnailSurface({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  return <ModelThumbnailRenderer scrollRoot={viewport} enabled>{children}</ModelThumbnailRenderer>;
}

export function ShortcutDeviceIcon({ modelId, models }: { modelId: string; models: DeviceModelRegistry }) {
  const definition = models[modelId];
  const entry = useMemo<ModelPreviewEntry | null>(() => definition
    ? { key: `device:${modelId}`, kind: "device", modelId, definition } : null,
  [definition, modelId]);
  return <span className="scene-action-device-preview">
    {entry ? <ModelThumbnail entry={entry} showAdd={false} transparent fallback={<EditorIcon name="devices" />} />
      : <EditorIcon name="devices" />}
  </span>;
}

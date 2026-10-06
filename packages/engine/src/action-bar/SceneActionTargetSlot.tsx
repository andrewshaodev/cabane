import type { ReactNode } from "react";
import type { ActionBarItem } from "./action-bar-config";
import type { ResolvedActionBarTarget } from "./dashboard-action-targets";
import { RoomShortcutIcon, SceneActionSlotFace } from "../SceneActionSlotFace";
export function SceneActionTargetSlot({
  item,
  target,
  renderDeviceIcon,
  onAction,
}: {
  item: ActionBarItem;
  target: ResolvedActionBarTarget;
  renderDeviceIcon?: ((modelId: string) => ReactNode) | undefined;
  onAction: (item: ActionBarItem) => void;
}) {
  return (
    <button
      key={item.id}
      type="button"
      className="scene-action-slot is-filled"
      aria-label={target.label}
      title={target.reason ?? target.label}
      aria-busy={target.pending || undefined}
      disabled={!target.available}
      onClick={() => onAction(item)}
    >
      <SceneActionSlotFace
        label={target.pending ? "Running…" : target.label}
        icon={
          item.target.kind === "scene" || item.target.kind === "script" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m8 5 11 7-11 7z" />
            </svg>
          ) : item.target.kind === "room" ? (
            <RoomShortcutIcon name={target.label} pictureUrl={target.pictureUrl} />
          ) : target.modelId && renderDeviceIcon ? (
            renderDeviceIcon(target.modelId)
          ) : (
            <svg viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
              <path d="M9 6h6" />
            </svg>
          )
        }
      />
    </button>
  );
}

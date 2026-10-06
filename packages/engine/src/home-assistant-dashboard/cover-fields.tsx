import { coverPosition } from "../cover-state";

import {
  coverActionCall,
  coverPositionCall,
  featureEnabled,
  type SupportedServiceCall,
} from "../home-assistant-controls";

import type { ResolvedEntityBinding } from "../types";

import { CommandRange } from "./control-primitives";

import { CommandAction } from "./command-actions";
import { confirmationKey } from "./entity-field-contract";

export function CoverFields({
  binding,
  enabled,
  onCallService,
}: {
  binding: ResolvedEntityBinding;
  enabled: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const entity = binding.state;
  if (!entity) return null;
  const position = coverPosition(entity);
  const movement =
    entity.state === "opening" ? "Opening" : entity.state === "closing" ? "Closing" : null;
  const status =
    !entity.available || entity.stale || ["unknown", "unavailable"].includes(entity.state)
      ? "Unavailable"
      : position === null
        ? (movement ?? "Position unknown")
        : `${movement ? `${movement} · ` : ""}${Math.round(position)}% open`;
  return (
    <div className="room-module__controls room-module__controls--cover">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {status}
      </output>
      <div className="room-module__action-row">
        {featureEnabled(entity, 1) && (
          <CommandAction
            label={`Open ${binding.label}`}
            confirmedKey={confirmationKey(entity)}
            disabled={!enabled}
            call={coverActionCall(entity, "open_cover")}
            onCallService={onCallService}
          />
        )}
        {featureEnabled(entity, 8) && (
          <CommandAction
            label={`Stop ${binding.label}`}
            confirmedKey={confirmationKey(entity)}
            disabled={!enabled}
            call={coverActionCall(entity, "stop_cover")}
            onCallService={onCallService}
          />
        )}
        {featureEnabled(entity, 2) && (
          <CommandAction
            label={`Close ${binding.label}`}
            confirmedKey={confirmationKey(entity)}
            disabled={!enabled}
            call={coverActionCall(entity, "close_cover")}
            onCallService={onCallService}
          />
        )}
      </div>
      {featureEnabled(entity, 4) && position !== null && (
        <CommandRange
          label={`${binding.label} position`}
          min={0}
          max={100}
          confirmedValue={position}
          confirmedKey={confirmationKey(entity, position)}
          disabled={!enabled}
          callForValue={(value) => coverPositionCall(entity, value)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

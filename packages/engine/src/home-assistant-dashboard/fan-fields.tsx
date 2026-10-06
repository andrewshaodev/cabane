import {
  fanPercentageCall,
  fanPowerCall,
  fanPresetCall,
  stringOptions,
  type SupportedServiceCall
} from "../home-assistant-controls";

import type { ResolvedEntityBinding } from "../types";

import {
  AdvancedControls,
  CommandRange,
  CommandToggle
} from "./control-primitives";

import { CommandOption } from "./command-actions";
import { confirmationKey, numberAttribute } from "./entity-field-contract";

export function FanFields({
  binding,
  enabled,
  focused,
  onCallService,
}: {
  binding: ResolvedEntityBinding;
  enabled: boolean;
  focused: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const entity = binding.state;
  if (!entity) return null;
  const percentage = numberAttribute(entity.attributes.percentage, 0);
  const presetOptions = stringOptions(entity.attributes.preset_modes);
  return (
    <div className="room-module__controls room-module__controls--fan">
      <CommandToggle
        label={binding.label}
        pressed={entity.state === "on"}
        disabled={!enabled}
        confirmedKey={confirmationKey(entity)}
        callForPressed={(pressed) => fanPowerCall(entity, pressed)}
        onCallService={onCallService}
      />
      {(typeof entity.attributes.percentage === "number" || typeof entity.attributes.speed_count === "number") && (
        <CommandRange
          label={`${binding.label} speed`}
          min={0}
          max={100}
          confirmedValue={percentage}
          confirmedKey={confirmationKey(entity, percentage)}
          disabled={!enabled}
          callForValue={(value) => fanPercentageCall(entity, value)}
          onCallService={onCallService}
        />
      )}
      {presetOptions.length > 0 && (
        <AdvancedControls label="More settings" defaultExpanded={focused}>
          <CommandOption
            label="Preset"
            value={String(entity.attributes.preset_mode ?? "")}
            options={presetOptions}
            disabled={!enabled}
            confirmedKey={confirmationKey(entity, String(entity.attributes.preset_mode ?? ""))}
            callForValue={(value) => fanPresetCall(entity, value)}
            onCallService={onCallService}
          />
        </AdvancedControls>
      )}
    </div>
  );
}

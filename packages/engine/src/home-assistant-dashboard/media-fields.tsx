import {
  featureEnabled,
  mediaPlaybackCall,
  mediaVolumeCall,
  type SupportedServiceCall
} from "../home-assistant-controls";

import type { ResolvedEntityBinding } from "../types";

import {
  CommandRange,
  useOptimisticCommand
} from "./control-primitives";

import { confirmationKey, numberAttribute } from "./entity-field-contract";

export function MediaFields({
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
  const playing = entity.state === "playing";
  const playback = useOptimisticCommand({
    confirmedKey: confirmationKey(entity),
    confirmedValue: playing,
    label: binding.label,
    onCallService,
  });
  const volume = numberAttribute(entity.attributes.volume_level, 0);
  const canPlay = featureEnabled(entity, 16384);
  const canPause = featureEnabled(entity, 1);
  const showPlayback = playback.value ? canPause : canPlay;
  const playbackAction = playback.value ? "Pause" : "Play";
  return (
    <div className="room-module__controls room-module__controls--media">
      {showPlayback && (
        <div className="room-module__playback">
          <button
            type="button"
            aria-label={`${playbackAction} ${binding.label}`}
            aria-pressed={playback.value}
            data-pending={playback.pending ? "true" : "false"}
            disabled={!enabled || playback.pending}
            onClick={() => {
              const nextPlaying = !playback.value;
              const callEntity = { ...entity, state: nextPlaying ? "paused" : "playing" };
              void playback.run(mediaPlaybackCall(callEntity), nextPlaying);
            }}
          >
            {playbackAction}
          </button>
          {playback.error && <p role="alert" aria-live="assertive">{playback.error}</p>}
        </div>
      )}
      {featureEnabled(entity, 4) && (
        <CommandRange
          label={`${binding.label} volume`}
          min={0}
          max={1}
          step={0.01}
          confirmedValue={volume}
          confirmedKey={confirmationKey(entity, volume)}
          disabled={!enabled}
          callForValue={(value) => mediaVolumeCall(entity, value)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

import { textAttribute } from "./entity-field-contract";
import { useEffect, useRef, useState } from "react";
import {
  VACUUM_FEATURE_FAN_SPEED,
  VACUUM_FEATURE_PAUSE,
  VACUUM_FEATURE_RETURN_HOME,
  VACUUM_FEATURE_START,
  VACUUM_FEATURE_STOP,
  buttonPressCall,
  featureEnabled,
  numberValueCall,
  numberValueRange,
  selectOptionCall,
  stringOptions,
  vacuumActionCall,
  vacuumFanSpeedCall,
  vacuumRoomCleanCall,
  vacuumRooms,
  type SupportedServiceCall,
  type VacuumRoom,
} from "../home-assistant-controls";
import type { ResolvedEntityBinding } from "../types";
import { CommandRange } from "./control-primitives";
import {
  DomainCommandAction,
  DomainCommandOption,
  domainConfirmationKey,
  domainNumberAttribute,
  readableDomainOption,
} from "./domain-control-shared";

interface DomainFieldsProps {
  binding: ResolvedEntityBinding;
  enabled: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

function VacuumRoomAction({
  room,
  entity,
  enabled,
  onCallService,
}: DomainFieldsProps & { room: VacuumRoom; entity: NonNullable<ResolvedEntityBinding["state"]> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const start = async () => {
    if (pending || !enabled) return;
    setPending(true);
    setError(false);
    try {
      await onCallService(vacuumRoomCleanCall(entity, [room.id]));
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="vacuum-room-action">
      <button
        type="button"
        aria-label={`Clean ${room.name}`}
        disabled={!enabled || pending}
        data-pending={pending ? "true" : "false"}
        onClick={() => void start()}
      >
        <span>{pending ? "Starting…" : room.name}</span>
        {room.name !== `Room ${room.id}` && <small>Room {room.id}</small>}
      </button>
      {error && (
        <p role="alert" aria-live="assertive">
          Couldn’t start {room.name}. Try again.
        </p>
      )}
    </div>
  );
}

export function VacuumFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const fanSpeeds = stringOptions(entity.attributes.fan_speed_list);
  const fanSpeed = textAttribute(entity.attributes.fan_speed ?? fanSpeeds[0] ?? "");
  const moving = ["cleaning", "returning"].includes(entity.state);
  const rooms = binding.registry?.platform === "dreame_vacuum" ? vacuumRooms(entity) : [];
  const batteryLevel = Number(entity.attributes.battery_level);
  const hasBatteryLevel = Number.isFinite(batteryLevel);
  return (
    <div className="room-module__controls room-module__controls--vacuum">
      <div className="vacuum-status">
        <output
          className="room-module__reading"
          aria-label={`${binding.label} status`}
          aria-live="polite"
        >
          {readableDomainOption(entity.state)}
        </output>
        {hasBatteryLevel && <span aria-label={`${batteryLevel}% battery`}>{batteryLevel}%</span>}
      </div>
      <div className="room-module__action-row vacuum-primary-actions">
        {featureEnabled(entity, VACUUM_FEATURE_START) && entity.state !== "cleaning" && (
          <DomainCommandAction
            label={`Clean everywhere with ${binding.label}`}
            buttonLabel="Clean everywhere"
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={vacuumActionCall(entity, "start")}
            onCallService={onCallService}
          />
        )}
        {featureEnabled(entity, VACUUM_FEATURE_PAUSE) && moving && (
          <DomainCommandAction
            label={`Pause ${binding.label}`}
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={vacuumActionCall(entity, "pause")}
            onCallService={onCallService}
          />
        )}
        {featureEnabled(entity, VACUUM_FEATURE_STOP) && moving && (
          <DomainCommandAction
            label={`Stop ${binding.label}`}
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={vacuumActionCall(entity, "stop")}
            onCallService={onCallService}
          />
        )}
        {featureEnabled(entity, VACUUM_FEATURE_RETURN_HOME) &&
          entity.state !== "docked" &&
          entity.state !== "returning" && (
            <DomainCommandAction
              label={`Dock ${binding.label}`}
              confirmedKey={domainConfirmationKey(entity)}
              disabled={!enabled}
              call={vacuumActionCall(entity, "return_to_base")}
              onCallService={onCallService}
            />
          )}
      </div>
      {rooms.length > 0 && (
        <section className="vacuum-rooms" aria-labelledby={`${binding.slotId}-vacuum-rooms-title`}>
          <div className="vacuum-rooms__heading">
            <h3 id={`${binding.slotId}-vacuum-rooms-title`}>Clean a room</h3>
            <span>Direct from Home Assistant</span>
          </div>
          <div className="vacuum-rooms__grid">
            {rooms.map((room) => (
              <VacuumRoomAction
                key={room.id}
                room={room}
                entity={entity}
                binding={binding}
                enabled={enabled && !moving}
                onCallService={onCallService}
              />
            ))}
          </div>
        </section>
      )}
      {featureEnabled(entity, VACUUM_FEATURE_FAN_SPEED) && fanSpeeds.length > 0 && (
        <DomainCommandOption
          label="Fan speed"
          value={fanSpeed}
          options={fanSpeeds}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity, fanSpeed)}
          callForValue={(value) => vacuumFanSpeedCall(entity, value)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

export function SelectFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const options = stringOptions(entity.attributes.options);
  return (
    <div className="room-module__controls room-module__controls--select">
      <output className="room-module__reading" aria-label={`${binding.label} current option`}>
        {readableDomainOption(entity.state)}
      </output>
      <DomainCommandOption
        label={binding.label}
        value={entity.state}
        options={options}
        disabled={!enabled}
        confirmedKey={domainConfirmationKey(entity)}
        callForValue={(value) => selectOptionCall(entity, value)}
        onCallService={onCallService}
      />
    </div>
  );
}

export function NumberFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const range = numberValueRange(entity);
  const value = domainNumberAttribute(entity.state, range.min);
  const unit =
    typeof entity.attributes.unit_of_measurement === "string"
      ? entity.attributes.unit_of_measurement
      : "";
  return (
    <div className="room-module__controls room-module__controls--number">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} current value`}
        aria-live="polite"
      >
        {value}
        {unit ? ` ${unit}` : ""}
      </output>
      <CommandRange
        label={binding.label}
        min={range.min}
        max={range.max}
        step={range.step}
        confirmedValue={value}
        confirmedKey={domainConfirmationKey(entity, value)}
        disabled={!enabled}
        callForValue={(nextValue) => numberValueCall(entity, nextValue)}
        onCallService={onCallService}
      />
    </div>
  );
}

export function ButtonFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const mounted = useRef(true);
  const pendingRef = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  if (!entity) return null;
  const press = async () => {
    if (pendingRef.current || !enabled) return;
    pendingRef.current = true;
    setPending(true);
    setResult(null);
    try {
      await onCallService(buttonPressCall(entity));
      if (mounted.current) setResult("success");
    } catch {
      if (mounted.current) setResult("error");
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return (
    <div className="room-module__controls room-module__controls--button">
      <button
        type="button"
        aria-label={`Press ${binding.label}`}
        disabled={!enabled || pending}
        data-pending={pending ? "true" : "false"}
        onClick={() => void press()}
      >
        Press
      </button>
      <span className="room-module__command-result" role="status" aria-live="polite">
        {pending ? "Sending…" : result === "success" ? "Sent" : ""}
      </span>
      {result === "error" && (
        <p role="alert" aria-live="assertive">
          Couldn’t press {binding.label}. Try again.
        </p>
      )}
    </div>
  );
}

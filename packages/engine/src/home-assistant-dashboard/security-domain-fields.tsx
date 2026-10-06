import { useEffect, useRef, useState } from "react";
import {
  ALARM_FEATURE_ARM_AWAY,
  ALARM_FEATURE_ARM_CUSTOM_BYPASS,
  ALARM_FEATURE_ARM_HOME,
  ALARM_FEATURE_ARM_NIGHT,
  ALARM_FEATURE_ARM_VACATION,
  LOCK_FEATURE_OPEN,
  SIREN_FEATURE_DURATION,
  SIREN_FEATURE_TONES,
  SIREN_FEATURE_TURN_OFF,
  SIREN_FEATURE_TURN_ON,
  SIREN_FEATURE_VOLUME_SET,
  VALVE_FEATURE_CLOSE,
  VALVE_FEATURE_OPEN,
  VALVE_FEATURE_SET_POSITION,
  VALVE_FEATURE_STOP,
  alarmActionCall,
  featureEnabled,
  lockActionCall,
  sirenPowerCall,
  stringOptions,
  valveActionCall,
  valvePositionCall,
  type AlarmAction,
  type SupportedServiceCall,
} from "../home-assistant-controls";
import type { ResolvedEntityBinding } from "../types";
import { CommandRange, CommandToggle } from "./control-primitives";
import {
  DomainCommandAction,
  ProtectedCodeDialog,
  domainConfirmationKey,
  domainNumberAttribute,
  readableDomainOption,
} from "./domain-control-shared";

interface DomainFieldsProps {
  binding: ResolvedEntityBinding;
  enabled: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

type LockAction = "lock" | "unlock" | "open";

const lockActionLabel = (action: LockAction, label: string) =>
  `${action === "open" ? "Open" : action === "unlock" ? "Unlock" : "Lock"} ${label}`;

export function LockFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  const [protectedAction, setProtectedAction] = useState<LockAction | null>(null);
  const [openConfirmationUntil, setOpenConfirmationUntil] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (openConfirmationUntil === 0) return;
    const timeout = window.setTimeout(
      () => setOpenConfirmationUntil(0),
      Math.max(0, openConfirmationUntil - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [openConfirmationUntil]);
  if (!entity) return null;
  const codeFormat =
    typeof entity.attributes.code_format === "string" ? entity.attributes.code_format : null;
  const moving = ["locking", "unlocking", "opening"].includes(entity.state);
  const callAction = async (action: LockAction, code?: string) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      await onCallService(lockActionCall(entity, action, code));
      setOpenConfirmationUntil(0);
    } catch (cause) {
      setError(`Couldn’t ${action} ${binding.label}. Try again.`);
      throw cause;
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };
  const requestAction = (action: LockAction) => {
    if (!enabled || pendingRef.current) return;
    if (action === "open" && Date.now() >= openConfirmationUntil) {
      setOpenConfirmationUntil(Date.now() + 5_000);
      return;
    }
    if (codeFormat) setProtectedAction(action);
    else void callAction(action).catch(() => undefined);
  };
  const actionButton = (action: LockAction) => (
    <button
      type="button"
      aria-label={lockActionLabel(action, binding.label)}
      disabled={!enabled || pending}
      data-pending={pending ? "true" : "false"}
      onClick={() => requestAction(action)}
    >
      {action === "open" && openConfirmationUntil > Date.now()
        ? "Confirm open"
        : action === "open"
          ? "Open"
          : action === "unlock"
            ? "Unlock"
            : "Lock"}
    </button>
  );
  return (
    <div className="room-module__controls room-module__controls--lock">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {readableDomainOption(entity.state)}
      </output>
      {!moving && (
        <div className="room-module__action-row">
          {entity.state !== "locked" && actionButton("lock")}
          {entity.state !== "unlocked" && actionButton("unlock")}
          {featureEnabled(entity, LOCK_FEATURE_OPEN) &&
            entity.state === "locked" &&
            actionButton("open")}
        </div>
      )}
      {error && (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      {protectedAction && codeFormat && (
        <ProtectedCodeDialog
          title={`${lockActionLabel(protectedAction, binding.label)} securely`}
          actionLabel={lockActionLabel(protectedAction, binding.label)}
          codeFormat={codeFormat}
          onCancel={() => setProtectedAction(null)}
          onSubmit={(code) => callAction(protectedAction, code)}
        />
      )}
    </div>
  );
}

const alarmModes: ReadonlyArray<{
  flag: number;
  service: AlarmAction;
  label: string;
}> = [
  { flag: ALARM_FEATURE_ARM_HOME, service: "alarm_arm_home", label: "Arm home" },
  { flag: ALARM_FEATURE_ARM_AWAY, service: "alarm_arm_away", label: "Arm away" },
  { flag: ALARM_FEATURE_ARM_NIGHT, service: "alarm_arm_night", label: "Arm night" },
  { flag: ALARM_FEATURE_ARM_VACATION, service: "alarm_arm_vacation", label: "Arm vacation" },
  {
    flag: ALARM_FEATURE_ARM_CUSTOM_BYPASS,
    service: "alarm_arm_custom_bypass",
    label: "Arm custom bypass",
  },
];

export function AlarmFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  const [protectedAction, setProtectedAction] = useState<{
    service: AlarmAction;
    label: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);
  if (!entity) return null;
  const codeFormat =
    typeof entity.attributes.code_format === "string" ? entity.attributes.code_format : null;
  const codeArmRequired = entity.attributes.code_arm_required === true;
  const execute = async (service: AlarmAction, code?: string) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      await onCallService(alarmActionCall(entity, service, code));
    } catch (cause) {
      setError(`Couldn’t update ${binding.label}. Try again.`);
      throw cause;
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };
  const request = (service: AlarmAction, label: string) => {
    if (!enabled || pendingRef.current) return;
    const disarming = service === "alarm_disarm";
    if (codeFormat && (disarming || codeArmRequired)) setProtectedAction({ service, label });
    else void execute(service).catch(() => undefined);
  };
  return (
    <div className="room-module__controls room-module__controls--alarm">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {readableDomainOption(entity.state)}
      </output>
      <div className="room-module__action-row room-module__action-row--wrap">
        {entity.state !== "disarmed" && (
          <button
            type="button"
            disabled={!enabled || pending}
            onClick={() => request("alarm_disarm", "Disarm")}
          >
            Disarm
          </button>
        )}
        {alarmModes
          .filter(({ flag }) => featureEnabled(entity, flag))
          .map(({ service, label }) => (
            <button
              type="button"
              key={service}
              disabled={
                !enabled || pending || entity.state === service.replace("alarm_arm_", "armed_")
              }
              data-pending={pending ? "true" : "false"}
              onClick={() => request(service, label)}
            >
              {label}
            </button>
          ))}
      </div>
      {error && (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      {protectedAction && codeFormat && (
        <ProtectedCodeDialog
          title={`${protectedAction.label} ${binding.label}`}
          actionLabel={protectedAction.label}
          codeFormat={codeFormat}
          onCancel={() => setProtectedAction(null)}
          onSubmit={(code) => execute(protectedAction.service, code)}
        />
      )}
    </div>
  );
}

export function ValveFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const position = domainNumberAttribute(entity.attributes.current_position, 0);
  const moving = ["opening", "closing"].includes(entity.state);
  return (
    <div className="room-module__controls room-module__controls--valve">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {readableDomainOption(entity.state)}
        {featureEnabled(entity, VALVE_FEATURE_SET_POSITION) ? ` · ${position}% open` : ""}
      </output>
      <div className="room-module__action-row">
        {!moving && featureEnabled(entity, VALVE_FEATURE_OPEN) && entity.state !== "open" && (
          <DomainCommandAction
            label={`Open ${binding.label}`}
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={valveActionCall(entity, "open_valve")}
            onCallService={onCallService}
          />
        )}
        {moving && featureEnabled(entity, VALVE_FEATURE_STOP) && (
          <DomainCommandAction
            label={`Stop ${binding.label}`}
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={valveActionCall(entity, "stop_valve")}
            onCallService={onCallService}
          />
        )}
        {!moving && featureEnabled(entity, VALVE_FEATURE_CLOSE) && entity.state !== "closed" && (
          <DomainCommandAction
            label={`Close ${binding.label}`}
            confirmedKey={domainConfirmationKey(entity)}
            disabled={!enabled}
            call={valveActionCall(entity, "close_valve")}
            onCallService={onCallService}
          />
        )}
      </div>
      {featureEnabled(entity, VALVE_FEATURE_SET_POSITION) && (
        <CommandRange
          label={`${binding.label} position`}
          min={0}
          max={100}
          confirmedValue={position}
          confirmedKey={domainConfirmationKey(entity, position)}
          disabled={!enabled}
          callForValue={(value) => valvePositionCall(entity, value)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

export function SirenFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  const tones = entity ? stringOptions(entity.attributes.available_tones) : [];
  const [tone, setTone] = useState(tones[0] ?? "");
  const [duration, setDuration] = useState(5);
  const [volume, setVolume] = useState(0.5);
  if (!entity) return null;
  const canTurnOn = featureEnabled(entity, SIREN_FEATURE_TURN_ON);
  const canTurnOff = featureEnabled(entity, SIREN_FEATURE_TURN_OFF);
  const pressed = entity.state === "on";
  return (
    <div className="room-module__controls room-module__controls--siren">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {pressed ? "On" : "Off"}
      </output>
      {((pressed && canTurnOff) || (!pressed && canTurnOn)) && (
        <CommandToggle
          label={binding.label}
          pressed={pressed}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity)}
          callForPressed={(nextPressed) =>
            sirenPowerCall(
              entity,
              nextPressed,
              nextPressed
                ? {
                    ...(featureEnabled(entity, SIREN_FEATURE_TONES) && tone ? { tone } : {}),
                    ...(featureEnabled(entity, SIREN_FEATURE_DURATION) ? { duration } : {}),
                    ...(featureEnabled(entity, SIREN_FEATURE_VOLUME_SET)
                      ? { volumeLevel: volume }
                      : {}),
                  }
                : {},
            )
          }
          onCallService={onCallService}
        />
      )}
      {!pressed && featureEnabled(entity, SIREN_FEATURE_TONES) && tones.length > 0 && (
        <label className="option-control">
          <span>Tone</span>
          <select
            value={tone}
            disabled={!enabled}
            onChange={(event) => setTone(event.currentTarget.value)}
          >
            {tones.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      )}
      {!pressed && featureEnabled(entity, SIREN_FEATURE_DURATION) && (
        <label className="room-module__local-setting">
          <span>Duration (seconds)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={duration}
            disabled={!enabled}
            onChange={(event) => setDuration(Math.max(1, Number(event.currentTarget.value) || 1))}
          />
        </label>
      )}
      {!pressed && featureEnabled(entity, SIREN_FEATURE_VOLUME_SET) && (
        <label className="room-module__local-setting">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            disabled={!enabled}
            onChange={(event) => setVolume(Number(event.currentTarget.value))}
          />
        </label>
      )}
    </div>
  );
}

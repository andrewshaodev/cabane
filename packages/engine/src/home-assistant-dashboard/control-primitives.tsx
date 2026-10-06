import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import type { SupportedServiceCall } from "../home-assistant-controls";

export interface CommandToggleProps {
  label: string;
  pressed: boolean;
  disabled: boolean;
  confirmedKey: string;
  callForPressed: (pressed: boolean) => SupportedServiceCall;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

export interface CommandRangeProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  confirmedValue: number;
  confirmedKey: string;
  disabled: boolean;
  callForValue: (value: number) => SupportedServiceCall;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

export interface TemperatureStepperProps extends Omit<CommandRangeProps, "label"> {
  label: string;
  onValueChange?: (value: number) => void;
}

export interface OptionControlProps {
  label: string;
  value: string;
  options: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
}

export interface AdvancedControlsProps {
  label: string;
  defaultExpanded: boolean;
  children: React.ReactNode;
}

const safeErrorMessage = (label: string) => `Couldn’t update ${label}. Try again.`;

export function useOptimisticCommand<T>({
  confirmedKey,
  confirmedValue,
  label,
  onCallService,
}: {
  confirmedKey: string;
  confirmedValue: T;
  label: string;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const [value, setValue] = useState(confirmedValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const sequence = useRef(0);
  const confirmed = useRef({ key: confirmedKey, value: confirmedValue });

  useLayoutEffect(() => {
    if (
      confirmed.current.key !== confirmedKey ||
      !Object.is(confirmed.current.value, confirmedValue)
    ) {
      confirmed.current = { key: confirmedKey, value: confirmedValue };
      sequence.current += 1;
    }
    setValue(confirmedValue);
    setPending(false);
    setError(null);
  }, [confirmedKey, confirmedValue]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (call: SupportedServiceCall, nextValue: T) => {
      const currentSequence = ++sequence.current;
      setValue(nextValue);
      setPending(true);
      setError(null);
      try {
        await onCallService(call);
        if (mounted.current && currentSequence === sequence.current) setPending(false);
        return true;
      } catch {
        if (mounted.current && currentSequence === sequence.current) {
          setValue(confirmed.current.value);
          setPending(false);
          setError(safeErrorMessage(label));
        }
        return false;
      }
    },
    [label, onCallService],
  );

  return { value, pending, error, run };
}

export function CommandToggle({
  label,
  pressed,
  disabled,
  confirmedKey,
  callForPressed,
  onCallService,
}: CommandToggleProps) {
  const command = useOptimisticCommand({
    confirmedKey,
    confirmedValue: pressed,
    label,
    onCallService,
  });
  const action = command.value ? "off" : "on";

  return (
    <div className="command-toggle">
      <button
        type="button"
        aria-label={`Turn ${action} ${label}`}
        aria-pressed={command.value}
        data-pending={command.pending ? "true" : "false"}
        disabled={disabled || command.pending}
        onClick={() => {
          const nextPressed = !command.value;
          void command.run(callForPressed(nextPressed), nextPressed);
        }}
      >
        Turn {action}
      </button>
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

export function CommandRange({
  label,
  min,
  max,
  step = 1,
  confirmedValue,
  confirmedKey,
  disabled,
  callForValue,
  onCallService,
}: CommandRangeProps) {
  const command = useOptimisticCommand({
    confirmedKey,
    confirmedValue,
    label,
    onCallService,
  });

  return (
    <div className="command-range">
      <label>
        <span>{label}</span>
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={command.value}
          disabled={disabled}
          data-pending={command.pending ? "true" : "false"}
          onInput={(event) => {
            const requestedValue = Number(event.currentTarget.value);
            if (Number.isFinite(requestedValue)) {
              void command.run(callForValue(requestedValue), requestedValue);
            }
          }}
        />
      </label>
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function TemperatureStepper({
  label,
  min,
  max,
  step = 1,
  confirmedValue,
  confirmedKey,
  disabled,
  callForValue,
  onCallService,
  onValueChange,
}: TemperatureStepperProps) {
  const command = useOptimisticCommand({
    confirmedKey,
    confirmedValue,
    label,
    onCallService,
  });
  useLayoutEffect(() => {
    onValueChange?.(command.value);
  }, [command.value, onValueChange]);
  const decrease = clamp(command.value - step, min, max);
  const increase = clamp(command.value + step, min, max);

  return (
    <div className="temperature-stepper" data-pending={command.pending ? "true" : "false"}>
      <output aria-label={label} aria-live="polite">
        {command.value}
      </output>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={disabled || decrease === command.value}
        onClick={() => void command.run(callForValue(decrease), decrease)}
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={disabled || increase === command.value}
        onClick={() => void command.run(callForValue(increase), increase)}
      >
        +
      </button>
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

export function OptionControl({ label, value, options, disabled, onChange }: OptionControlProps) {
  if (options.length === 0) return null;
  const selectedValue = options.includes(value) ? value : options[0];

  return (
    <label className="option-control">
      <span>{label}</span>
      <select
        value={selectedValue}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdvancedControls({ label, defaultExpanded, children }: AdvancedControlsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const regionId = useId();

  return (
    <section className="advanced-controls">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={regionId}
        onClick={() => setExpanded((current) => !current)}
      >
        {label}
      </button>
      <div id={regionId} role="region" aria-label={label} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}

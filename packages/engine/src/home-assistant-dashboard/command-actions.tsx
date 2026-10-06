import { type SupportedServiceCall } from "../home-assistant-controls";

import { OptionControl, useOptimisticCommand } from "./control-primitives";

export function CommandOption({
  label,
  value,
  options,
  disabled,
  confirmedKey,
  callForValue,
  onCallService,
}: {
  label: string;
  value: string;
  options: readonly string[];
  disabled: boolean;
  confirmedKey: string;
  callForValue: (value: string) => SupportedServiceCall;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const command = useOptimisticCommand({
    confirmedKey,
    confirmedValue: value,
    label,
    onCallService,
  });
  return (
    <div className="room-module__option" data-pending={command.pending ? "true" : "false"}>
      <OptionControl
        label={label}
        value={command.value}
        options={options}
        disabled={disabled || command.pending}
        onChange={(nextValue) => void command.run(callForValue(nextValue), nextValue)}
      />
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

export function CommandAction({
  label,
  confirmedKey,
  disabled,
  call,
  onCallService,
}: {
  label: string;
  confirmedKey: string;
  disabled: boolean;
  call: SupportedServiceCall;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const command = useOptimisticCommand({
    confirmedKey,
    confirmedValue: false,
    label,
    onCallService,
  });
  return (
    <div className="room-module__action">
      <button
        type="button"
        aria-label={label}
        data-pending={command.pending ? "true" : "false"}
        disabled={disabled || command.pending}
        onClick={() => void command.run(call, true)}
      >
        {label.split(" ", 1)[0]}
      </button>
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

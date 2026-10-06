import { useCabaneDom } from "./../CabaneDom";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { EntityStateSnapshot } from "../types";
import type { SupportedServiceCall } from "../home-assistant-controls";
import { OptionControl, useOptimisticCommand } from "./control-primitives";

export const domainConfirmationKey = (
  entity: EntityStateSnapshot,
  value: string | number | boolean = entity.state,
) => `${String(value)}:${entity.lastUpdated ?? entity.lastConfirmedAt ?? ""}`;

export const domainNumberAttribute = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const readableDomainOption = (option: string) =>
  option.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

export function DomainCommandOption({
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

export function DomainCommandAction({
  label,
  buttonLabel,
  confirmedKey,
  disabled,
  call,
  onCallService,
}: {
  label: string;
  buttonLabel?: string;
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
        {buttonLabel ?? label.split(" ", 1)[0]}
      </button>
      {command.error && (
        <p role="alert" aria-live="assertive">
          {command.error}
        </p>
      )}
    </div>
  );
}

const numericCodeFormat = (codeFormat: string) =>
  codeFormat === "number" || codeFormat.includes("\\d") || codeFormat.includes("0-9");

export function ProtectedCodeDialog({
  title,
  actionLabel,
  codeFormat,
  onCancel,
  onSubmit,
}: {
  title: string;
  actionLabel: string;
  codeFormat: string;
  onCancel: () => void;
  onSubmit: (code: string) => Promise<unknown>;
}) {
  const dom = useCabaneDom();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current =
      dom.root.activeElement instanceof HTMLElement ? dom.root.activeElement : null;
    inputRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const submittedCode = inputRef.current?.value ?? "";
    if (!submittedCode || pending) return;
    setPending(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    try {
      await onSubmit(submittedCode);
      onCancel();
    } catch {
      setPending(false);
      setError(`Couldn’t ${actionLabel.toLowerCase()}. Try again.`);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="protected-code-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="protected-code-dialog-title"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) onCancel();
        if (event.key === "Tab") {
          const controls = [
            ...(dialogRef.current?.querySelectorAll<HTMLElement>(
              "input:not(:disabled), button:not(:disabled)",
            ) ?? []),
          ];
          if (controls.length === 0) return;
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && dom.root.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && dom.root.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <form onSubmit={(event) => void submit(event)}>
        <h3 id="protected-code-dialog-title">{title}</h3>
        <label>
          <span>Security code</span>
          <input
            ref={inputRef}
            type="password"
            inputMode={numericCodeFormat(codeFormat) ? "numeric" : "text"}
            pattern={codeFormat !== "number" && codeFormat !== "text" ? codeFormat : undefined}
            autoComplete="off"
            required
            disabled={pending}
          />
        </label>
        {error && (
          <p role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <div className="protected-code-dialog__actions">
          <button type="button" disabled={pending} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="is-primary"
            disabled={pending}
            data-pending={pending ? "true" : "false"}
          >
            {actionLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

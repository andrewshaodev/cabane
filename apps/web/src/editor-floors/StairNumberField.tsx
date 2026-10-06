import { useEffect, useId, useState } from "react";

/** Keep incomplete or invalid input local so the scene retains renderable geometry. */
export function StairNumberField({
  label,
  value,
  onCommit,
  minimum,
  maximum,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  minimum?: number | undefined;
  maximum?: number | undefined;
}) {
  const [text, setText] = useState(String(Number(value.toFixed(2))));
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  useEffect(() => {
    setText(String(Number(value.toFixed(2))));
    setError(null);
  }, [value]);
  const commit = (raw: string) => {
    if (raw === String(Number(value.toFixed(2)))) {
      setError(null);
      return;
    }
    const next = raw.trim() ? Number(raw) : NaN;
    const message = !Number.isFinite(next)
      ? "Enter a finite number."
      : minimum !== undefined && next <= minimum
        ? `Enter a value greater than ${minimum}.`
        : maximum !== undefined && next > maximum
          ? `Enter a value of ${maximum} or less.`
          : null;
    setError(message);
    if (!message && next !== value) onCommit(next);
  };
  return (
    <label className="construction-inspector__single-control stair-number-field">
      {label}
      <input
        aria-label={label}
        type="number"
        step="any"
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.stopPropagation();
            event.currentTarget.value = String(Number(value.toFixed(2)));
            setText(event.currentTarget.value);
            setError(null);
            event.currentTarget.blur();
          }
        }}
      />
      {error && (
        <span id={errorId} className="stair-number-field__error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

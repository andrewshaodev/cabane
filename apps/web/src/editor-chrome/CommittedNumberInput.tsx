import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function CommittedNumberInput({
  label,
  value,
  min,
  max,
  step = 0.1,
  onCommit,
  commitOnChange = false,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (value: number) => void;
  commitOnChange?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    if (commitOnChange) {
      setDraft(String(value));
      return;
    }
    const next = Number(draft);
    if (Number.isFinite(next) && next !== value) onCommit(next);
    else setDraft(String(value));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      cancelled.current = true;
      setDraft(String(value));
      event.currentTarget.blur();
    }
  };
  return (
    <input
      aria-label={label}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const next = event.target.valueAsNumber;
        if (
          commitOnChange &&
          Number.isFinite(next) &&
          (min === undefined || next >= min) &&
          next !== value
        )
          onCommit(next);
      }}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  );
}

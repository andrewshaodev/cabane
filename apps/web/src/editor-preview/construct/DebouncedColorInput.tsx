import { useEffect, useRef, useState } from "react";

export function DebouncedColorInput({
  label,
  value,
  disabled = false,
  onCommit,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const commit = useRef(onCommit);

  useEffect(() => {
    setDraft(value);
    latest.current = value;
  }, [value]);
  useEffect(() => {
    commit.current = onCommit;
  }, [onCommit]);
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const flush = () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    if (latest.current !== value) commit.current(latest.current);
  };

  return (
    <input
      aria-label={label}
      type="color"
      value={draft}
      disabled={disabled}
      onInput={(event) => {
        const next = event.currentTarget.value;
        latest.current = next;
        setDraft(next);
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(() => {
          pending.current = null;
          commit.current(latest.current);
        }, 160);
      }}
      onBlur={flush}
    />
  );
}

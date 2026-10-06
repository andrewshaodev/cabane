export type PresenceStatusIconState = "present" | "absent" | "unavailable";

export function PresenceStatusIcon({ state }: { state: PresenceStatusIconState }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-presence-icon={state}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 20c.7-4 2.5-6 5.5-6s4.8 2 5.5 6" />
      {state === "present" && <path d="M4 8a8 8 0 0 1 2-4M20 8a8 8 0 0 0-2-4" />}
      {state === "absent" && <path d="M4 4l16 16" />}
    </svg>
  );
}

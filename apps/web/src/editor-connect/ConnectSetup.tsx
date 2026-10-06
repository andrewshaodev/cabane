import { useEffect, useId, useState } from "react";
import { HomeAssistantCorsHelp, OnboardingPrivacy, validateHomeAssistantUrlInput, type HomeAssistantRuntimeValue } from "@cabane/engine";
import { EditorIcon } from "../editor-chrome/EditorIcon";

export function ConnectSetup({ origin, runtime, busy, pendingDevice, onConnect, onBack }: {
  origin: string | null; runtime: HomeAssistantRuntimeValue; busy: boolean; pendingDevice?: string;
  onConnect: (origin: string) => Promise<void>; onBack?: () => void;
}) {
  const [value, setValue] = useState(origin ?? "");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  useEffect(() => { setValue(origin ?? ""); }, [origin]);
  const connecting = ["authenticating", "connecting", "reconnecting"].includes(runtime.status);
  return <section className="connect-setup" aria-labelledby={`${id}-title`} aria-busy={busy || connecting}>
    {onBack && <button className="connect-back" type="button" onClick={onBack}><EditorIcon name="back" />Back to connections</button>}
    <header className="connect-inspector__heading"><h3 id={`${id}-title`}>{connecting ? "Connecting your home…" : "Sign in to Home Assistant"}</h3></header>
    <p className="connect-copy">{connecting ? "Waiting for Home Assistant to finish sign-in and load your rooms and devices." : "Enter your Home Assistant address to choose which rooms and devices to connect."}</p>
    {pendingDevice && <p className="connect-note">You’ll return to <strong>{pendingDevice}</strong> after connecting.</p>}
    <form noValidate onSubmit={(event) => {
      event.preventDefault();
      if (busy || connecting) return;
      const result = validateHomeAssistantUrlInput(value);
      setError(result.error);
      if (result.normalized) void onConnect(result.normalized);
    }}>
      <label htmlFor={`${id}-url`}>Home Assistant address</label>
      <input id={`${id}-url`} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        value={value} placeholder="Home Assistant address" disabled={busy || connecting}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        onChange={(event) => { setValue(event.target.value); setError(null); }} />
      {error && <p id={`${id}-error`} role="alert">{error}</p>}
      <button type="submit" className="connect-primary" disabled={busy || connecting}>
        {busy ? "Preparing sign-in…" : connecting ? "Connecting…" : "Continue to Home Assistant"}<EditorIcon name="external" />
      </button>
      <p className="connect-note" id={`${id}-help`}>Home Assistant opens for sign-in, then returns you here.</p>
      <OnboardingPrivacy />
      <HomeAssistantCorsHelp />
    </form>
  </section>;
}

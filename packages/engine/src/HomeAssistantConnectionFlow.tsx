import { useHomeAssistantHostSession } from "./HomeAssistantHostSession";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { BrowserDataImportResult } from "./browser-data-transfer";
import { HomeAssistantCorsHelp } from "./HomeAssistantCorsHelp";
import type { HomeAssistantRuntimeValue } from "./HomeAssistantRuntime";
import { homeAssistantTransportError, normalizeHomeAssistantUrl } from "./home-assistant-auth";

export const validateHomeAssistantUrlInput = (value: string) => {
  const normalized = normalizeHomeAssistantUrl(value);
  if (!normalized)
    return {
      normalized: null,
      error:
        "Enter the full Home Assistant address, including https:// and a port if needed (for example, https://homeassistant.local:8123). Do not include credentials.",
    };
  const parsed = new URL(value.trim());
  if ((parsed.pathname && parsed.pathname !== "/") || parsed.search || parsed.hash) {
    return {
      normalized: null,
      error: "Use only the Home Assistant origin—remove any path, query, or fragment.",
    };
  }
  const transportError =
    typeof window === "undefined"
      ? null
      : homeAssistantTransportError(window.location.href, normalized);
  if (transportError) return { normalized: null, error: transportError };
  return { normalized, error: null };
};

export function HomeAssistantConnectionFlow({
  homeAssistantUrl,
  runtime,
  onHomeAssistantUrlChange,
  onImportBrowserData,
  onDefer,
  onClose,
}: {
  homeAssistantUrl: string | null;
  runtime: HomeAssistantRuntimeValue;
  onHomeAssistantUrlChange: (url: string | null) => void;
  onImportBrowserData?: ((json: string) => BrowserDataImportResult) | undefined;
  onDefer: () => void;
  onClose: () => void;
}) {
  const hostSession = useHomeAssistantHostSession();
  const [value, setValue] = useState(homeAssistantUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const busy = ["authenticating", "connecting", "reconnecting"].includes(runtime.status);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateHomeAssistantUrlInput(value);
    setError(result.error);
    if (result.normalized) onHomeAssistantUrlChange(result.normalized);
  };
  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !onImportBrowserData) return;
    void file.text().then((json) => {
      const result = onImportBrowserData(json);
      setImportMessage(
        result.valid
          ? "Browser data imported. Reauthorize Home Assistant to continue."
          : (result.issues[0]?.message ?? "The selected browser-data file could not be imported."),
      );
    });
  };

  return (
    <section
      className="setup-task-surface ha-connection-flow"
      aria-labelledby="ha-connection-title"
    >
      <header className="setup-task-surface__header">
        <button type="button" onClick={onClose} aria-label="Back to setup checklist">
          ←
        </button>
        <span>Connect Home Assistant</span>
      </header>
      <div className="setup-task-surface__body">
        {hostSession ? (
          <>
            <h2 id="ha-connection-title">Connect this Home Assistant</h2>
            <p>Sign-in is managed by Home Assistant.</p>
            <p>{hostSession.origin}</p>
            {homeAssistantUrl && homeAssistantUrl !== hostSession.origin && (
              <p role="alert">
                This workspace uses a different Home Assistant: {homeAssistantUrl}. Select this
                instance explicitly; its mappings remain separate.
              </p>
            )}
            {runtime.error && <p role="alert">{runtime.error}</p>}
            {homeAssistantUrl !== hostSession.origin && (
              <button type="button" onClick={() => onHomeAssistantUrlChange(hostSession.origin)}>
                Use this Home Assistant
              </button>
            )}
            {homeAssistantUrl === hostSession.origin &&
              ["error", "disconnected"].includes(runtime.status) && (
                <button type="button" onClick={runtime.retry}>
                  Retry connection
                </button>
              )}
            <button type="button" onClick={onDefer}>
              Do it later
            </button>
          </>
        ) : !homeAssistantUrl ? (
          <>
            <p className="setup-task-surface__eyebrow">Home Assistant address</p>
            <h2 id="ha-connection-title">Where does your Home Assistant live?</h2>
            <p>Use the same private address you open on this device. It stays in this browser.</p>
            <form className="ha-connection-flow__form" onSubmit={submit} noValidate>
              <label htmlFor="home-assistant-url">Home Assistant URL</label>
              <div className={error ? "has-error" : undefined}>
                <input
                  id="home-assistant-url"
                  type="url"
                  inputMode="url"
                  placeholder="Home Assistant address"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={value}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "home-assistant-url-error" : "home-assistant-url-help"}
                  onChange={(event) => {
                    setValue(event.currentTarget.value);
                    setError(null);
                  }}
                />
                <button type="submit">Continue</button>
              </div>
              {error ? (
                <span id="home-assistant-url-error" role="alert">
                  {error}
                </span>
              ) : (
                <span id="home-assistant-url-help">
                  Use only the origin. No password or token is entered here.
                </span>
              )}
            </form>
            <div className="setup-task-surface__actions">
              <button type="button" onClick={onDefer}>
                Do it later
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="setup-task-surface__eyebrow">Secure browser sign-in</p>
            <h2 id="ha-connection-title">
              {busy ? "Connecting to Home Assistant…" : "Authorize this dashboard."}
            </h2>
            <p>
              {busy
                ? "Cabane is reading areas, devices and current state. No service is called during discovery."
                : "Home Assistant handles sign-in, then returns you to this browser automatically."}
            </p>
            <div className="ha-connection-flow__origin">
              <span aria-hidden="true">HA</span>
              <div>
                <small>Home Assistant</small>
                <strong>{homeAssistantUrl}</strong>
              </div>
              <i className={`connection-dot status-${runtime.status}`} aria-hidden="true" />
            </div>
            {runtime.error && (
              <p className="ha-connection-flow__error" role="alert">
                {runtime.error}
              </p>
            )}
            <div className="setup-task-surface__actions">
              {!busy && runtime.status !== "connected" && (
                <button
                  type="button"
                  className="is-primary"
                  onClick={runtime.status === "error" ? runtime.retry : runtime.connect}
                >
                  {runtime.status === "error" ? "Try again" : "Continue to Home Assistant"}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onHomeAssistantUrlChange(null);
                  setValue("");
                }}
              >
                Change address
              </button>
              <button type="button" onClick={onDefer}>
                Do it later
              </button>
            </div>
          </>
        )}

        {!hostSession && <HomeAssistantCorsHelp />}
        {!hostSession && onImportBrowserData && (
          <div className="ha-connection-flow__import">
            <label>
              Import Cabane browser data
              <input type="file" accept="application/json,.json" onChange={importFile} />
            </label>
            <span>
              Imported Home Assistant access still requires authorization on this browser.
            </span>
          </div>
        )}
        {importMessage && (
          <p className="ha-connection-flow__feedback" role="status">
            {importMessage}
          </p>
        )}
      </div>
    </section>
  );
}

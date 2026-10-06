import { useState } from "react";
import "./home-assistant-cors-help.css";

export function HomeAssistantCorsHelp() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const [copyMessage, setCopyMessage] = useState("");

  return (
    <details className="ha-cors-help">
      <summary>Camera previews and CORS settings</summary>
      <p>
        Sign-in and device controls normally work without changing CORS. If camera previews are
        blocked, allow this Cabane address in Home Assistant:
      </p>
      <div className="ha-cors-help__origin">
        <code>{origin}</code>
        <button
          type="button"
          disabled={!origin}
          onClick={() => {
            void (async () => {
              try {
                await navigator.clipboard.writeText(origin);
                setCopyMessage("Address copied.");
              } catch {
                setCopyMessage("Could not copy. Select and copy the address above.");
              }
            })();
          }}
        >
          Copy address
        </button>
      </div>
      <span role="status">{copyMessage}</span>
      <p>
        Open <strong>Settings → System → Network → HTTP server → CORS allowed origins</strong> in
        Home Assistant and add this address, including its scheme and port, without a page path.
      </p>
      <p>
        Saving restarts Home Assistant. After it restarts, confirm the settings as an administrator
        within 5 minutes to keep them.
      </p>
      <p>
        Before Home Assistant 2026.8, add the address under <code>http.cors_allowed_origins</code>{" "}
        in <code>configuration.yaml</code> and restart.
      </p>
      <a href="https://www.home-assistant.io/integrations/http/" target="_blank" rel="noreferrer">
        Home Assistant HTTP settings
      </a>
    </details>
  );
}

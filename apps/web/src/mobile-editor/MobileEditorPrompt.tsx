import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { editorPath } from "../editor-routes";
import "./mobile-editor-prompt.css";

const dismissedKey = "cabane:mobile-editor-prompt-dismissed";
const shareUrl = "https://cabane.my";

export function mobileEditorViewport(): boolean {
  return window.matchMedia("(max-width: 760px)").matches;
}

export function mobileEditorPromptDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(dismissedKey) === "true";
  } catch {
    return false;
  }
}

export function MobileEditorPrompt({
  workspaceId,
  demoWorkspaceId,
}: {
  workspaceId: string;
  demoWorkspaceId: string | null;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");
  const mode = searchParams.get("mode") === "arrange" ? "furnish" : "construct";
  const continueEditing = () => {
    try {
      window.sessionStorage.setItem(dismissedKey, "true");
    } catch {
      /* Session preference is optional. */
    }
    void navigate(editorPath({ mode }, workspaceId), { replace: true });
  };
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Cabane", url: shareUrl });
        setMessage("Link shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setMessage("Link copied. Open it on your other device.");
      } else {
        setMessage(`Open ${shareUrl} on your other device.`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(`Sharing was unavailable. Open ${shareUrl} on your other device.`);
    }
  };

  return (
    <main
      className="mobile-editor-prompt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-editor-title"
      aria-describedby="mobile-editor-description"
    >
      <div className="mobile-editor-prompt__panel">
        <button
          className="mobile-editor-prompt__close"
          type="button"
          aria-label="Dismiss and build on mobile"
          onClick={continueEditing}
        >
          ×
        </button>
        <div className="mobile-editor-prompt__visual" aria-hidden="true">
          <div className="mobile-editor-prompt__screen">
            <div className="mobile-editor-prompt__screen-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="mobile-editor-prompt__floor">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="mobile-editor-prompt__screen-rail">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="mobile-editor-prompt__phone">
            <div className="mobile-editor-prompt__phone-plan">
              <span />
              <span />
            </div>
          </div>
        </div>
        <div className="mobile-editor-prompt__content">
          <h1 id="mobile-editor-title">Make room for the bigger picture.</h1>
          <p id="mobile-editor-description">
            Construct and Arrange work best on a desktop, where there’s space to shape every detail
            of your home.
          </p>
          <div className="mobile-editor-prompt__actions">
            <button
              type="button"
              className="mobile-editor-prompt__demo"
              disabled={!demoWorkspaceId}
              onClick={() => {
                if (demoWorkspaceId) void navigate("/demo");
              }}
            >
              <span>Explore the demo</span>
              <small>See what Cabane can look like. Try turning your phone sideways!</small>
            </button>
            <button
              type="button"
              className="mobile-editor-prompt__share"
              onClick={() => void share()}
            >
              Share to my other device
            </button>
            <button
              type="button"
              className="mobile-editor-prompt__continue"
              onClick={continueEditing}
            >
              Build on mobile anyway
            </button>
          </div>
          {!demoWorkspaceId && (
            <p className="mobile-editor-prompt__note">
              The demo home is no longer in this browser.
            </p>
          )}
          {message && (
            <p className="mobile-editor-prompt__status" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

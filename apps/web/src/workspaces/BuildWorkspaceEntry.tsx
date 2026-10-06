import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { useWorkspaceOnboarding } from "./useWorkspaceOnboarding";

/** Direct /build visits use the same atomic create/resume operation as the welcome button. */
export function BuildWorkspaceEntry({
  onboarding,
}: {
  onboarding: ReturnType<typeof useWorkspaceOnboarding>;
}) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void onboarding.start("build");
  }, [onboarding, onboarding.start]);
  return (
    <main className="direction-project-loading">
      {onboarding.error ? (
        <>
          <strong>Could not start your home.</strong>
          <p>{onboarding.error}</p>
          <button disabled={onboarding.busy} onClick={() => void onboarding.start("build")}>
            Try again
          </button>
          <Link to="/workspaces">Workspaces</Link>
        </>
      ) : (
        "Opening your home…"
      )}
    </main>
  );
}

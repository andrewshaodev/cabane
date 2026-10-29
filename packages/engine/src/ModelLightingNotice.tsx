import { useState } from "react";
import type { ManifestIssue } from "./types";

/** Uses the existing recovery notice without blocking the scene or editing. */
export function ModelLightingNotice({
  issues,
  onEdit,
}: {
  issues: readonly ManifestIssue[];
  onEdit?: (() => void) | undefined;
}) {
  const [dismissed, setDismissed] = useState(false);
  const warnings = issues.filter((issue) => issue.code === "model.lighting-disabled");
  if (dismissed || !warnings.length) return null;
  return (
    <aside className="layout-recovery-notice runtime-lighting-notice" role="status">
      <span>
        {warnings.map((issue) => (
          <strong key={issue.path}>{issue.message}</strong>
        ))}
      </span>
      {onEdit && (
        <button type="button" onClick={onEdit}>
          Edit lighting
        </button>
      )}
      <button type="button" onClick={() => setDismissed(true)}>
        Dismiss
      </button>
    </aside>
  );
}

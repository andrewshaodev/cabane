import { useEffect, useState } from "react";
import type { ConstructContextualIssue } from "./contextual-validation";
import { constructIssueKey } from "./validation-visuals";

/** Hiding a label never dismisses validation. Locate and recurrence restore it. */
export function useValidationLabels(
  issues: readonly ConstructContextualIssue[],
  activeIssueKey: string | null,
  focusVersion: number,
) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    const currentKeys = new Set(issues.map(constructIssueKey));
    setHiddenKeys((current) => {
      const retained = [...current].filter((key) => currentKeys.has(key));
      return retained.length === current.size ? current : new Set(retained);
    });
  }, [issues]);
  useEffect(() => {
    if (!activeIssueKey) return;
    setHiddenKeys((current) => {
      if (!current.has(activeIssueKey)) return current;
      const next = new Set(current);
      next.delete(activeIssueKey);
      return next;
    });
  }, [activeIssueKey, focusVersion]);
  return {
    hiddenKeys,
    hide: (keys: readonly string[]) => setHiddenKeys((current) => new Set([...current, ...keys])),
  };
}

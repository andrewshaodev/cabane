import { useId, useState } from "react";
import type { ConstructValidationDiagnostic } from "../editor-preview/construct/contextual-validation";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { EditorButton } from "../editor-chrome/EditorButton";

/** Draft diagnostics live outside the tools and properties surfaces. */
export function EditorValidationPanel<Issue extends ConstructValidationDiagnostic>({
  issues,
  onSelect,
  expanded: controlledExpanded,
  onToggle,
  disabled = false,
  onRepair,
  itemLabel,
}: {
  issues: readonly Issue[];
  onSelect: (issue: Issue) => void;
  expanded?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  onRepair?: (issue: Issue, action: "reset-placement" | "remove") => void;
  itemLabel?: (issue: Issue) => string | undefined;
}) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const contentId = useId();
  if (!issues.length) return null;
  const errorCount = issues.filter((issue) => issue.severity !== "warning").length;
  const warningCount = issues.length - errorCount;
  return (
    <section
      className="editor-issues construction-inspector__validation"
      data-expanded={expanded}
      aria-label="Editor validation"
    >
      <button
        type="button"
        className="editor-issues__disclosure"
        aria-label={`Issues: ${[errorCount ? `${errorCount} ${errorCount === 1 ? "error" : "errors"}` : "", warningCount ? `${warningCount} ${warningCount === 1 ? "warning" : "warnings"}` : ""].filter(Boolean).join(", ")}`}
        aria-expanded={expanded}
        aria-controls={contentId}
        disabled={disabled}
        onClick={onToggle ?? (() => setLocalExpanded((current) => !current))}
      >
        <strong>Issues</strong>
        <span className="editor-issues__counts" aria-live="polite" aria-atomic="true">
          {errorCount > 0 && (
            <span data-severity="error">
              <EditorIcon name="warning" />
              {errorCount}
              <span className="editor-issues__count-label">
                {" "}
                {errorCount === 1 ? "error" : "errors"}
              </span>
            </span>
          )}
          {warningCount > 0 && (
            <span data-severity="warning">
              <EditorIcon name="warning" />
              {warningCount}
              <span className="editor-issues__count-label">
                {" "}
                {warningCount === 1 ? "warning" : "warnings"}
              </span>
            </span>
          )}
        </span>
        <EditorIcon name="chevron" />
      </button>
      <ul id={contentId} hidden={!expanded}>
        {issues.map((issue, index) => {
          const content = (
            <>
              <span className="construction-inspector__validation-marker">
                <EditorIcon name="warning" />
              </span>
              <span>
                {itemLabel?.(issue) && <strong>{itemLabel(issue)}</strong>}
                <strong>{issue.message}</strong>
                {issue.suggestion && <small>{issue.suggestion}</small>}
              </span>
              {issue.target && (
                <span className="editor-issues__locate" aria-hidden="true">
                  <EditorIcon name="spawn" />{" "}
                  {issue.target.kind === "scene-item" ? "Select in Arrange" : "Locate"}
                </span>
              )}
            </>
          );
          return (
            <li key={`${issue.code}:${issue.path}:${index}`} data-severity={issue.severity}>
              {issue.target ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${issue.target.kind === "scene-item" ? "Select in Arrange" : "Locate"} ${issue.target.kind} ${issue.target.id}: ${issue.message}`}
                  onClick={() => onSelect(issue)}
                >
                  {content}
                </button>
              ) : (
                <div>{content}</div>
              )}
              {issue.target?.kind === "scene-item" && onRepair && (
                <footer className="editor-issues__actions">
                  {issue.path.includes(".placement") && (
                    <EditorButton
                      variant="text"
                      disabled={disabled}
                      onClick={() => onRepair(issue, "reset-placement")}
                    >
                      Reset placement
                    </EditorButton>
                  )}
                  <EditorButton
                    variant="text"
                    disabled={disabled}
                    onClick={() => onRepair(issue, "remove")}
                  >
                    Remove
                  </EditorButton>
                </footer>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

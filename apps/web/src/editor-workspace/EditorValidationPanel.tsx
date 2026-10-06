import type { ConstructValidationDiagnostic } from "../editor-preview/construct/contextual-validation";
import { EditorIcon } from "../editor-chrome/EditorIcon";

/** Shared draft diagnostics stay available beside every editor mode. */
export function EditorValidationPanel<Issue extends ConstructValidationDiagnostic>({
  issues,
  onSelect,
}: {
  issues: readonly Issue[];
  onSelect: (issue: Issue) => void;
}) {
  if (!issues.length) return null;
  const errorCount = issues.filter((issue) => issue.severity !== "warning").length;
  const warningCount = issues.length - errorCount;
  return (
    <section
      className="construction-inspector__validation"
      aria-label="Editor validation"
      aria-live="polite"
    >
      <header>
        <strong>
          {issues.length} {issues.length === 1 ? "issue" : "issues"}
        </strong>
        <span>
          {errorCount > 0 && `${errorCount} ${errorCount === 1 ? "error" : "errors"}`}
          {errorCount > 0 && warningCount > 0 && " · "}
          {warningCount > 0 && `${warningCount} ${warningCount === 1 ? "warning" : "warnings"}`}
        </span>
      </header>
      <ul>
        {issues.map((issue, index) => {
          const content = (
            <>
              <span className="construction-inspector__validation-marker">
                <EditorIcon name="warning" />
              </span>
              <span>
                <strong>{issue.message}</strong>
                {issue.suggestion && <small>{issue.suggestion}</small>}
              </span>
              {issue.target && (
                <span className="construction-inspector__validation-arrow" aria-hidden="true">
                  Locate →
                </span>
              )}
            </>
          );
          return (
            <li key={`${issue.code}:${issue.path}:${index}`} data-severity={issue.severity}>
              {issue.target ? (
                <button
                  type="button"
                  aria-label={`Locate ${issue.target.kind} ${issue.target.id}: ${issue.message}`}
                  onClick={() => onSelect(issue)}
                >
                  {content}
                </button>
              ) : (
                <div>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

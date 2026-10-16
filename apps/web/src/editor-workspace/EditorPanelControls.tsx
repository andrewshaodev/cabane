import { EditorIcon } from "../editor-chrome/EditorIcon";
import type { useEditorPanels } from "./useEditorPanels";

export function EditorPanelControls({
  panels,
  issueCount,
  disabled,
}: {
  panels: ReturnType<typeof useEditorPanels>;
  issueCount: number;
  disabled: boolean;
}) {
  return (
    <>
      {panels.hasSelection && !panels.propertiesOpen && (
        <button
          className="editor-properties-toggle"
          type="button"
          disabled={disabled}
          onClick={panels.openProperties}
          aria-expanded={false}
          aria-controls="editor-properties"
        >
          <EditorIcon name="details" />
          Properties
        </button>
      )}
      <div className="editor-panel-switcher" role="group" aria-label="Editor panels">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={panels.mobileSurface === "tools"}
          onClick={panels.showTools}
        >
          Tools
        </button>
        {panels.hasSelection && (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={panels.mobileSurface === "properties"}
            onClick={panels.openProperties}
          >
            Properties
          </button>
        )}
        {issueCount > 0 && (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={panels.mobileSurface === "issues"}
            onClick={panels.showIssues}
          >
            Issues <span>{issueCount}</span>
          </button>
        )}
      </div>
    </>
  );
}

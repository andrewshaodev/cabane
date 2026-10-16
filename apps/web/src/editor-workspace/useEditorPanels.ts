import { useEffect, useReducer } from "react";
import type { useHomeEditorController } from "./useHomeEditorController";

type SelectionContext = Pick<
  ReturnType<typeof useHomeEditorController>,
  "mode" | "activeFloorId" | "constructEditor" | "stairDialog" | "furnishingEditor"
>;

/** Panel identity follows selection; property edits never reopen a collapsed panel. */
export function editorPanelSelection(
  { mode, activeFloorId, constructEditor, stairDialog, furnishingEditor }: SelectionContext,
  shortcutsMode: boolean,
): string | null {
  if (shortcutsMode) return null;
  let target: string | null = null;
  if (mode === "construct") {
    const selection = constructEditor.selection;
    target = stairDialog
      ? `stair:${stairDialog.id}`
      : selection?.kind === "multiple"
        ? selection.targets
            .map(({ kind, id }) => `${kind}:${id}`)
            .sort()
            .join("|")
        : selection
          ? `${selection.kind}:${selection.id}`
          : null;
  } else if (mode === "furnish" && furnishingEditor.selectedIds.length) {
    target = [...furnishingEditor.selectedIds].sort().join("|");
  }
  return target ? `${mode}:${activeFloorId}:${target}` : null;
}

type Surface = "tools" | "properties" | "issues";
interface PanelState {
  selection: string | null;
  hasIssues: boolean;
  collapsed: boolean;
  issuesExpanded: boolean;
  surface: Surface;
}
type Action =
  | { type: "selection"; selection: string | null; hasIssues: boolean }
  | { type: "properties" | "collapse" | "issues" | "tools" | "show-issues" };
function reduce(state: PanelState, action: Action): PanelState {
  switch (action.type) {
    case "selection":
      if (action.selection === state.selection)
        return action.hasIssues === state.hasIssues
          ? state
          : { ...state, hasIssues: action.hasIssues };
      return {
        ...state,
        selection: action.selection,
        hasIssues: action.hasIssues,
        collapsed: false,
        surface: action.selection
          ? "properties"
          : state.surface === "properties"
            ? "tools"
            : state.surface,
      };
    case "properties":
      return { ...state, collapsed: false, surface: "properties" };
    case "collapse":
      return { ...state, collapsed: true, surface: "tools" };
    case "tools":
      return { ...state, surface: "tools" };
    case "show-issues":
      return { ...state, issuesExpanded: true, surface: "issues" };
    case "issues":
      return {
        ...state,
        issuesExpanded: !state.issuesExpanded,
        surface: state.issuesExpanded ? "tools" : "issues",
      };
  }
}

export function useEditorPanels(selection: string | null, busy: boolean, hasIssues = true) {
  const [state, dispatch] = useReducer(reduce, {
    selection,
    hasIssues,
    collapsed: false,
    issuesExpanded: false,
    surface: selection ? "properties" : "tools",
  });
  // Selection changes on pointer-down. Reflow only after the gesture settles.
  useEffect(() => {
    if (!busy) dispatch({ type: "selection", selection, hasIssues });
  }, [busy, selection, hasIssues]);
  return {
    propertiesOpen: !!state.selection && !state.collapsed,
    hasSelection: !!selection,
    issuesExpanded: state.issuesExpanded,
    issuesOpen: state.issuesExpanded && state.hasIssues,
    mobileSurface: state.surface,
    openProperties: () => dispatch({ type: "properties" }),
    collapseProperties: () => dispatch({ type: "collapse" }),
    showIssues: () => dispatch({ type: "show-issues" }),
    showTools: () => dispatch({ type: "tools" }),
    toggleIssues: () => dispatch({ type: "issues" }),
  };
}

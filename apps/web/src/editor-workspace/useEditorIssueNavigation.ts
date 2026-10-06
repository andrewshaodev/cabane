import { useCallback, useEffect, useState } from "react";
import type { ConstructContextualIssue } from "../editor-preview/construct/contextual-validation";
import type { EditorMode } from "../editor-chrome/EditorModeNav";

/** Floor restoration settles before selection, so it cannot erase Locate's target. */
export function useEditorIssueNavigation({
  activeFloorId,
  previewFloorId,
  selectFloor,
  focusCameraIssue,
  selectMode,
}: {
  activeFloorId: string;
  previewFloorId: string;
  selectFloor: (floorId: string) => void;
  focusCameraIssue: (
    issue: ConstructContextualIssue,
    selectMode: (mode: EditorMode) => void,
  ) => void;
  selectMode: (mode: EditorMode) => void;
}) {
  const [pendingIssue, setPendingIssue] = useState<ConstructContextualIssue | null>(null);
  const focusIssue = useCallback(
    (issue: ConstructContextualIssue) => {
      if (issue.floorId && issue.floorId !== activeFloorId) {
        setPendingIssue(issue);
        selectFloor(issue.floorId);
      } else focusCameraIssue(issue, selectMode);
    },
    [activeFloorId, selectFloor, focusCameraIssue, selectMode],
  );
  useEffect(() => {
    if (!pendingIssue || previewFloorId !== pendingIssue.floorId) return;
    focusCameraIssue(pendingIssue, selectMode);
    setPendingIssue(null);
  }, [pendingIssue, previewFloorId, focusCameraIssue, selectMode]);
  return focusIssue;
}

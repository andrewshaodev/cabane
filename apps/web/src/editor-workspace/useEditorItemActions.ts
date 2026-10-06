import { collectProjectIds } from "@cabane/engine";
import type { useConstructEditor } from "../editor-preview/construct";
import { useEditorSceneProjection } from "./useEditorSceneProjection";

import { useCallback, useEffect, useState } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import { useFurnishingEditor } from "../editor-preview/furnish";

type Options = {
  furnishingEditor: ReturnType<typeof useFurnishingEditor>;
  projection: ReturnType<typeof useEditorSceneProjection>;
  mode: EditorMode;
  clearFocus: () => void;
  floor: ReturnType<typeof useConstructEditor>["previewFloor"];
};
export function useEditorItemActions({
  furnishingEditor,
  projection,
  mode,
  clearFocus,
  floor: constructEditorPreviewFloor,
}: Options) {
  const {
    select: furnishingEditorSelect,
    selectedId: furnishingEditorSelectedId,
    deleteItem: furnishingEditorDeleteItem,
    duplicate: furnishingEditorDuplicate,
    items: furnishingEditorItems,
  } = furnishingEditor;
  const { editorProject } = projection;
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);
  useEffect(() => {
    setDetailsItemId(null);
  }, [mode, furnishingEditorSelectedId]);
  const clearFurnishingSelection = useCallback(() => {
    setDetailsItemId(null);
    furnishingEditorSelect(null);
    clearFocus();
  }, [furnishingEditorSelect, clearFocus]);

  const deleteSceneItem = useCallback(
    (id: string) => {
      furnishingEditorDeleteItem(id);
      clearFurnishingSelection();
    },
    [clearFurnishingSelection, furnishingEditorDeleteItem],
  );

  const duplicateArrangeItem = useCallback(
    (id: string) => {
      if (!furnishingEditorItems.some((item) => item.id === id)) return false;
      setDetailsItemId(null);
      furnishingEditorDuplicate(id, constructEditorPreviewFloor, collectProjectIds(editorProject));
      return true;
    },
    [constructEditorPreviewFloor, editorProject, furnishingEditorDuplicate, furnishingEditorItems],
  );
  return {
    detailsItemId,
    setDetailsItemId,
    clearFurnishingSelection,
    deleteSceneItem,
    duplicateArrangeItem,
  };
}

import { collectProjectIds } from "@cabane/engine";
import type { useConstructEditor } from "../editor-preview/construct";
import { useEditorSceneProjection } from "./useEditorSceneProjection";

import { useCallback } from "react";

import { useFurnishingEditor } from "../editor-preview/furnish";

type Options = {
  furnishingEditor: ReturnType<typeof useFurnishingEditor>;
  projection: ReturnType<typeof useEditorSceneProjection>;
  clearFocus: () => void;
  floor: ReturnType<typeof useConstructEditor>["previewFloor"];
};
export function useEditorItemActions({
  furnishingEditor,
  projection,
  clearFocus,
  floor: constructEditorPreviewFloor,
}: Options) {
  const {
    select: furnishingEditorSelect,
    deleteItem: furnishingEditorDeleteItem,
    duplicate: furnishingEditorDuplicate,
    items: furnishingEditorItems,
  } = furnishingEditor;
  const { editorProject } = projection;
  const clearFurnishingSelection = useCallback(() => {
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
      furnishingEditorDuplicate(id, constructEditorPreviewFloor, collectProjectIds(editorProject));
      return true;
    },
    [constructEditorPreviewFloor, editorProject, furnishingEditorDuplicate, furnishingEditorItems],
  );
  return {
    clearFurnishingSelection,
    deleteSceneItem,
    duplicateArrangeItem,
  };
}

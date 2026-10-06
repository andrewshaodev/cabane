import { useCallback, useMemo, useReducer, useState } from "react";
import type {
  FloorSpec,
  FurnishingModelDefinition,
  ItemPlacement,
  PlanPoint,
  SceneItemSpec,
  SceneItemSize,
  SceneModelEditorDescriptor,
} from "@cabane/engine";
import { createFurnishingEditorState, furnishingEditorReducer } from "./editor-state";

export const useFurnishingEditor = (initialItems: readonly SceneItemSpec[]) => {
  const [state, dispatch] = useReducer(
    furnishingEditorReducer,
    initialItems,
    createFurnishingEditorState,
  );
  const [multipleIds, setMultipleIds] = useState<string[]>([]);
  const selectedIds = state.selectedId
    ? [state.selectedId]
    : multipleIds.filter((id) => state.items.some((item) => item.id === id));
  const selectedItem = useMemo(
    () => state.items.find((item) => item.id === state.selectedId) ?? null,
    [state.items, state.selectedId],
  );

  return {
    ...state,
    selectedIds,
    selectMany: useCallback((ids: string[]) => {
      setMultipleIds(ids);
      dispatch({ type: "select", id: ids.length === 1 ? ids[0] : null });
    }, []),
    addItem: useCallback((item: SceneItemSpec) => dispatch({ type: "add-item", item }), []),
    selectedItem,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    select: useCallback((id: string | null) => {
      setMultipleIds([]);
      dispatch({ type: "select", id });
    }, []),
    beginTransaction: useCallback(() => dispatch({ type: "begin-transaction" }), []),
    commitTransaction: useCallback(() => dispatch({ type: "commit-transaction" }), []),
    cancelTransaction: useCallback(() => dispatch({ type: "cancel-transaction" }), []),
    updateVariant: useCallback(
      (id: string, variant: string, definition: SceneModelEditorDescriptor) =>
        dispatch({ type: "update-variant", id, variant, definition }),
      [],
    ),
    updateLightState: useCallback(
      (id: string, lightState: "always-off" | "always-on" | "night-only" | "connected") =>
        dispatch({ type: "update-light-state", id, lightState }),
      [],
    ),
    updatePlacements: useCallback(
      (placements: Readonly<Record<string, ItemPlacement>>) =>
        dispatch({ type: "update-placements", placements }),
      [],
    ),
    updatePlacement: useCallback(
      (id: string, placement: ItemPlacement) =>
        dispatch({ type: "update-placement", id, placement }),
      [],
    ),
    updateSize: useCallback(
      (id: string, size: SceneItemSize, definition: SceneModelEditorDescriptor) =>
        dispatch({ type: "update-size", id, size, definition }),
      [],
    ),
    rotate: useCallback(
      (id: string, rotationYRadians: number) => dispatch({ type: "rotate", id, rotationYRadians }),
      [],
    ),
    duplicate: useCallback(
      (id: string, floor?: FloorSpec, reservedSlotIds?: readonly string[]) =>
        dispatch({
          type: "duplicate",
          id,
          ...(floor === undefined ? {} : { floor: floor }),
          ...(reservedSlotIds === undefined ? {} : { reservedSlotIds: reservedSlotIds }),
        }),
      [],
    ),
    deleteItems: useCallback(
      (ids: readonly string[]) => dispatch({ type: "delete-items", ids }),
      [],
    ),
    deleteItem: useCallback((id: string) => dispatch({ type: "delete", id }), []),
    addPreset: useCallback(
      (
        floorId: string,
        modelId: string,
        definition: FurnishingModelDefinition,
        planCenter: PlanPoint,
        placement?: ItemPlacement,
      ) =>
        dispatch({
          type: "add-preset",
          floorId,
          modelId,
          definition,
          planCenter,
          ...(placement === undefined ? {} : { placement: placement }),
        }),
      [],
    ),
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    redo: useCallback(() => dispatch({ type: "redo" }), []),
    replaceItems: useCallback((items: readonly SceneItemSpec[], selectedId?: string | null) => {
      setMultipleIds([]);
      dispatch({
        type: "replace-items",
        items,
        ...(selectedId === undefined ? {} : { selectedId: selectedId }),
      });
    }, []),
  };
};

export type FurnishingEditorController = ReturnType<typeof useFurnishingEditor>;

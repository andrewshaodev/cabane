import type { ActionBarItem } from "@cabane/engine";
import { reconcileFloorSelection, useFloorNavigation } from "@cabane/engine";

import { type HomeProject } from "@cabane/engine";

import { useCallback, useEffect, useRef } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import { useConstructEditor, useFloorZoneDrawing } from "../editor-preview/construct";

import { useFurnishingEditor } from "../editor-preview/furnish";

import {
  projectEditorRestoration,
  workspaceSnapshotFromEditorState,
} from "../editor-preview/project-sync";

import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";

import { ownerProjectRegistries } from "../project-runtime";

type Options = {
  workspace: ReturnType<typeof useEditorWorkspace>;
  constructEditor: ReturnType<typeof useConstructEditor>;
  furnishingEditor: ReturnType<typeof useFurnishingEditor>;
  floorZoneDrawing: ReturnType<typeof useFloorZoneDrawing>;
  activeFloorId: string;
  selectFloor: ReturnType<typeof useFloorNavigation>["selectFloor"];
  editingLocked: boolean;
  unsettled: boolean;
  dragging: boolean;
  previewSceneItems: ReturnType<typeof useFurnishingEditor>["items"];
  editorProjectJson: string;
  editorProject: HomeProject;
  mode: EditorMode;
  onRestore: () => void;
};
export function useEditorProjectHistory({
  workspace,
  constructEditor,
  furnishingEditor,
  floorZoneDrawing,
  activeFloorId,
  selectFloor: floorNavigationSelectFloor,
  editingLocked,
  unsettled,
  dragging,
  previewSceneItems,
  editorProjectJson,
  editorProject,
  mode,
  onRestore,
}: Options) {
  const { snapshot, commit, undo, redo } = workspace;
  const {
    draft: constructEditorDraft,
    replaceFloor: constructEditorReplaceFloor,
    previewFloor: constructEditorPreviewFloor,
    topologyIssues: constructEditorTopologyIssues,
    poolDrawing,
  } = constructEditor;
  const {
    selectedId: furnishingEditorSelectedId,
    items: furnishingEditorItems,
    replaceItems: furnishingEditorReplaceItems,
    select: furnishingEditorSelect,
    transaction: furnishingEditorTransaction,
  } = furnishingEditor;
  const {
    active: floorZoneDrawingActive,
    undo: floorZoneDrawingUndo,
    redo: floorZoneDrawingRedo,
  } = floorZoneDrawing;
  const editorSyncTarget = useRef<{
    draft: typeof constructEditor.draft;
    items: typeof furnishingEditor.items;
    floorChanged: boolean;
  } | null>(null);

  const pendingFloorItem = useRef<string | null>(null);
  const selectSceneItem = (id: string) => {
    if (unsettled || editingLocked) return;
    const item = snapshot.project.sceneItems.find((item) => item.id === id);
    if (!item) return;
    if (item.floorId === activeFloorId) furnishingEditorSelect(id);
    else {
      pendingFloorItem.current = id;
      floorNavigationSelectFloor(item.floorId);
    }
  };

  const replaceEditorsFromProject = useCallback(
    (project: HomeProject) => {
      const previous = snapshot.project;
      const restoration = projectEditorRestoration(
        previous,
        project,
        furnishingEditorSelectedId,
        activeFloorId,
      );
      const restoredId = reconcileFloorSelection(
        { activeFloorId, wholeBuilding: false },
        previous.floors.map((floor) => floor.id),
        project.floors.map((floor) => floor.id),
      ).activeFloorId;
      const floor = project.floors.find((entry) => entry.id === restoredId)!;
      restoration.floorChanged ||= floor.id !== constructEditorDraft.floorId;
      editorSyncTarget.current = {
        draft: constructEditorDraft,
        items: furnishingEditorItems,
        floorChanged: restoration.floorChanged,
      };
      if (restoration.floorChanged) constructEditorReplaceFloor(floor);
      furnishingEditorReplaceItems(
        project.sceneItems.filter((item) => item.floorId === floor.id),
        pendingFloorItem.current ?? restoration.selectedItemId,
      );
      pendingFloorItem.current = null;
      onRestore();
    },
    [
      activeFloorId,
      onRestore,
      snapshot.project,
      constructEditorDraft,
      constructEditorReplaceFloor,
      furnishingEditorItems,
      furnishingEditorReplaceItems,
      furnishingEditorSelectedId,
    ],
  );

  const undoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawingActive) {
      floorZoneDrawingUndo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) {
      poolDrawing.undo();
      return;
    }
    if (unsettled || editingLocked) return;
    const next = undo();
    if (next) replaceEditorsFromProject(next.project);
  }, [
    editingLocked,
    dragging,
    floorZoneDrawingActive,
    poolDrawing,
    unsettled,
    undo,
    replaceEditorsFromProject,
    floorZoneDrawingUndo,
  ]);

  const redoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawingActive) {
      floorZoneDrawingRedo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) {
      poolDrawing.redo();
      return;
    }
    if (unsettled || editingLocked) return;
    const next = redo();
    if (next) replaceEditorsFromProject(next.project);
  }, [
    editingLocked,
    dragging,
    floorZoneDrawingActive,
    poolDrawing,
    unsettled,
    redo,
    replaceEditorsFromProject,
    floorZoneDrawingRedo,
  ]);

  useEffect(() => {
    if (unsettled || editingLocked || constructEditorDraft.floorId !== activeFloorId) return;
    const syncTarget = editorSyncTarget.current;
    if (syncTarget) {
      // Topology canonicalization need not serialize byte-for-byte like the
      // history snapshot. Wait for the requested replacements, then consume the sync
      // once; otherwise an undo can silently block every subsequent command.
      if (
        (!syncTarget.floorChanged || constructEditorDraft !== syncTarget.draft) &&
        furnishingEditorItems !== syncTarget.items
      ) {
        editorSyncTarget.current = null;
      }
      return;
    }
    commit(
      workspaceSnapshotFromEditorState(
        snapshot,
        constructEditorPreviewFloor,
        previewSceneItems,
        ownerProjectRegistries,
        constructEditorTopologyIssues.map((issue) => ({ ...issue, severity: "error" as const })),
      ),
    );
  }, [
    constructEditorDraft,
    constructEditorPreviewFloor,
    editorProjectJson,
    constructEditorTopologyIssues,
    editingLocked,
    unsettled,
    commit,
    snapshot,
    furnishingEditorItems,
    furnishingEditorTransaction,
    mode,
    previewSceneItems,
    activeFloorId,
  ]);

  const setActionBarItems = useCallback(
    (items: readonly ActionBarItem[]) => {
      if (editingLocked || unsettled) return;
      commit({ ...snapshot, project: { ...editorProject, actionBar: { items } } });
    },
    [commit, editingLocked, editorProject, snapshot, unsettled],
  );
  return {
    setActionBarItems,
    replaceEditorsFromProject,
    undoProject,
    redoProject,
    selectSceneItem,
  };
}

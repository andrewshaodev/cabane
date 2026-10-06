import { EditorButton } from "../editor-chrome/EditorButton";
import { requestWalkPointerLock } from "@cabane/engine";
import { useMemo, useState } from "react";
import { EditorActionBar } from "../editor-chrome/EditorActionBar";

import { EditorIcon } from "../editor-chrome/EditorIcon";

import { EditorModeNav, type EditorMode } from "../editor-chrome/EditorModeNav";

import { ConnectActionBar } from "../editor-connect/ConnectActionBar";

import type { useHomeEditorController } from "./useHomeEditorController";

type Props = Pick<
  ReturnType<typeof useHomeEditorController>,
  | "editingLocked"
  | "publishOpen"
  | "previewOpen"
  | "activeFloorId"
  | "stairPlacement"
  | "setStairPlacement"
  | "startStairs"
  | "snapshot"
  | "mode"
  | "cameraView"
  | "setCameraView"
  | "walkButton"
  | "unsettled"
  | "setPreviewOpen"
  | "selectMode"
  | "closeEditor"
  | "closing"
  | "setPublishMessage"
  | "setPublishOpen"
  | "connect"
  | "runtime"
  | "constructEditor"
  | "dragging"
  | "floorZoneDrawing"
  | "poolDrawing"
  | "workspace"
  | "undoProject"
  | "redoProject"
  | "replaceEditorsFromProject"
> & {
  referenceAdjusting?: boolean;
  shortcutsMode: boolean;
  onModeTabChange: (mode: EditorMode | "shortcuts") => void;
};
export function HomeEditorHeader({
  referenceAdjusting,
  activeFloorId,
  stairPlacement,
  setStairPlacement,
  startStairs,
  snapshot,
  editingLocked,
  publishOpen,
  previewOpen,
  mode,
  cameraView,
  setCameraView,
  walkButton,
  unsettled,
  setPreviewOpen,
  selectMode,
  closeEditor,
  closing,
  setPublishMessage,
  setPublishOpen,
  connect,
  runtime,
  constructEditor,
  dragging,
  floorZoneDrawing,
  poolDrawing,
  workspace,
  undoProject,
  redoProject,
  shortcutsMode,
  onModeTabChange,
  replaceEditorsFromProject,
}: Props) {
  const [walkError, setWalkError] = useState<string | null>(null);
  const hasSaved = workspace.record.publishedAt !== 0;
  const hasChanges = useMemo(
    () =>
      JSON.stringify(snapshot.project) !== JSON.stringify(workspace.record.published) ||
      Object.values(snapshot.bindings).some(
        (binding) => JSON.stringify(binding.draft) !== JSON.stringify(binding.published),
      ),
    [snapshot.project, snapshot.bindings, workspace.record.published],
  );
  return (
    <header className="editor-header" inert={editingLocked || publishOpen || previewOpen}>
      <div className="editor-navigation">
        <button
          type="button"
          className="editor-close"
          disabled={editingLocked || unsettled || !hasSaved}
          title={hasSaved ? "Back to Home" : "Save your home before returning to Home"}
          onClick={() => void closeEditor()}
        >
          <EditorIcon name="back" />
          {closing ? "Returning…" : "Back"}
        </button>
        {mode !== "connect" && (
          <div className="direction-camera" role="group" aria-label="Camera controls">
            {mode === "construct" ? (
              <span className="construction-plan__indicator" title="2D floor plan">
                <EditorIcon name="plan" />
                2D
              </span>
            ) : (
              <>
                <button
                  type="button"
                  title="View the home in 3D"
                  aria-pressed={cameraView === "3d"}
                  onClick={() => setCameraView("3d")}
                >
                  <EditorIcon name="cube" />
                  3D
                </button>
                <button
                  type="button"
                  title="View the floor plan"
                  aria-pressed={cameraView === "top"}
                  onClick={() => setCameraView("top")}
                >
                  <EditorIcon name="plan" />
                  2D
                </button>
              </>
            )}
            <button
              ref={walkButton}
              type="button"
              title="Walk through the draft at eye level"
              aria-haspopup="dialog"
              disabled={editingLocked || unsettled}
              onClick={async (event) => {
                setWalkError(null);
                if (window.matchMedia("(pointer: coarse)").matches) {
                  setPreviewOpen(true);
                  return;
                }
                const target = event.currentTarget.closest("main");
                try {
                  if (!target) throw new Error("Pointer lock unavailable");
                  await requestWalkPointerLock(target);
                  setPreviewOpen(true);
                } catch {
                  setWalkError("Allow pointer lock in your browser to explore this home.");
                }
              }}
            >
              <EditorIcon name="walk" />
              Explore
            </button>
          </div>
        )}
      </div>
      {walkError && <p role="alert">{walkError}</p>}
      <EditorModeNav mode={shortcutsMode ? "shortcuts" : mode} onModeChange={onModeTabChange} />
      <div className="direction-project-actions" role="group" aria-label="Project actions">
        <button
          type="button"
          className="editor-reset-changes"
          aria-label="Reset changes"
          disabled={editingLocked || unsettled || !hasChanges}
          title="Discard draft changes and restore the saved version"
          onClick={async () => {
            if (
              !window.confirm(
                "Reset changes? This discards all draft home and connection changes and restores the last saved version.",
              )
            )
              return;
            const result = await workspace.resetDraftToPublished();
            if (result.status === "saved") replaceEditorsFromProject(result.record.draft);
          }}
        >
          <EditorIcon name="reset" />
          Reset
        </button>
        <EditorButton
          variant="primary"
          disabled={editingLocked || unsettled}
          onClick={() => {
            setPublishMessage(null);
            setPublishOpen(true);
          }}
        >
          <EditorIcon name="save" />
          Save
        </EditorButton>
      </div>
      {mode === "connect" ? (
        <ConnectActionBar
          view={connect.view}
          onViewChange={connect.setView}
          hasUnmappedRooms={connect.hasUnmappedRooms}
          refreshing={runtime.refreshing}
          disconnected={connect.disconnected}
          onRefresh={() => void connect.refresh()}
        />
      ) : (
        <EditorActionBar
          inert={referenceAdjusting}
          mode={mode}
          tool={constructEditor.tool}
          onToolChange={(tool) => {
            setStairPlacement(null);
            constructEditor.setTool(tool);
          }}
          onStairs={startStairs}
          stairsActive={Boolean(stairPlacement)}
          stairsDisabledReason={
            snapshot.project.floors.at(-1)?.id === activeFloorId
              ? "Add a floor above first, then place stairs from this floor."
              : editingLocked || unsettled
                ? "Finish the current edit first."
                : undefined
          }
          canUndo={
            !editingLocked &&
            !dragging &&
            (floorZoneDrawing.active
              ? floorZoneDrawing.points.length > 0
              : poolDrawing.active
                ? poolDrawing.points.length > 0
                : workspace.canUndo && !unsettled)
          }
          canRedo={
            !editingLocked &&
            !dragging &&
            (floorZoneDrawing.active
              ? floorZoneDrawing.future.length > 0
              : poolDrawing.active
                ? poolDrawing.future.length > 0
                : workspace.canRedo && !unsettled)
          }
          onUndo={undoProject}
          onRedo={redoProject}
        />
      )}
    </header>
  );
}

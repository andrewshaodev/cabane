import { roomAnchorForPolygon } from "@cabane/engine";
import type { ConnectWorkspaceProps } from "./editor-workspace-contract";

import { type PlanPoint } from "@cabane/engine";

import { useCallback, useRef, useState } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import {
  constructIssueKey,
  constructIssuePlanPoint,
  constructIssueVisualTargets,
  constructTargetPlanPoint,
  useConstructEditor,
  type ConstructContextualIssue,
} from "../editor-preview/construct";

import { useFurnishingEditor } from "../editor-preview/furnish";

import { type EditorCameraState } from "../editor-connect/connect-navigation";

type CameraView = "3d" | "top";
type Options = {
  initialRequest: ConnectWorkspaceProps["initialRequest"];
  constructEditor: ReturnType<typeof useConstructEditor>;
  furnishingEditor: ReturnType<typeof useFurnishingEditor>;
  previewSceneItems: ReturnType<typeof useFurnishingEditor>["items"];
};
export function useEditorCamera({
  initialRequest,
  constructEditor,
  furnishingEditor,
  previewSceneItems,
}: Options) {
  const {
    previewFloor: constructEditorPreviewFloor,
    selectOpening: constructEditorSelectOpening,
    selectPool: constructEditorSelectPool,
    selectPlatform: constructEditorSelectPlatform,
    selectFloorZone: constructEditorSelectFloorZone,
    selectRoom: constructEditorSelectRoom,
    selectWall: constructEditorSelectWall,
    setTool: constructEditorSetTool,
    wallRuns: constructEditorWallRuns,
  } = constructEditor;
  const { select: furnishingEditorSelect } = furnishingEditor;
  const [cameraView, setCameraView] = useState<CameraView>(
    initialRequest?.arrange?.camera?.view ?? "3d",
  );
  const savedCamera = useRef<EditorCameraState | null>(initialRequest?.arrange?.camera ?? null);
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraFocusRoomId, setCameraFocusRoomId] = useState<string | null>(null);
  const [cameraFocusPoint, setCameraFocusPoint] = useState<PlanPoint | null>(null);
  const [activeIssueKey, setActiveIssueKey] = useState<string | null>(null);
  const [issueFocusVersion, setIssueFocusVersion] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const focusIssue = useCallback(
    (issue: ConstructContextualIssue, selectMode: (mode: EditorMode) => void) => {
      setCameraFocusRoomId(null);
      const targets = constructIssueVisualTargets(
        issue,
        constructEditorPreviewFloor,
        previewSceneItems,
      );
      const target =
        issue.target && issue.target.kind !== "junction"
          ? issue.target
          : (targets.find(
              (target) =>
                target.kind === "scene-item" ||
                target.kind === "opening" ||
                target.kind === "niche",
            ) ?? targets[0]);
      const itemTarget = target?.kind === "scene-item" ? target : undefined;
      if (itemTarget) {
        selectMode("furnish");
        furnishingEditorSelect(itemTarget.id);
      } else {
        selectMode("construct");
        constructEditorSetTool("select");
        if (target?.kind === "opening" || target?.kind === "niche")
          constructEditorSelectOpening(target.id);
        else if (target?.kind === "pool") constructEditorSelectPool(target.id);
        else if (target?.kind === "outdoor-platform") constructEditorSelectPlatform(target.id);
        else if (target?.kind === "floor-zone") constructEditorSelectFloorZone(target.id);
        else if (target?.kind === "room") constructEditorSelectRoom(target.id);
        else if (target?.kind === "ceiling") {
          const roomId = constructEditorPreviewFloor.ceilings?.find(
            (ceiling) => ceiling.id === target.id,
          )?.roomIds[0];
          if (roomId) constructEditorSelectRoom(roomId);
        } else if (target?.kind === "wall")
          constructEditorSelectWall(
            constructEditorWallRuns.find((run) => run.wallId === target.id)?.sourceWallId ??
              target.id,
          );
      }
      setActiveIssueKey(constructIssueKey(issue));
      setIssueFocusVersion((version) => version + 1);
      setCameraFocusPoint(
        target
          ? constructTargetPlanPoint(target, constructEditorPreviewFloor, previewSceneItems)
          : constructIssuePlanPoint(issue, constructEditorPreviewFloor, previewSceneItems),
      );
      setCameraResetKey((key) => key + 1);
    },
    [
      constructEditorPreviewFloor,
      constructEditorSelectOpening,
      constructEditorSelectPool,
      constructEditorSelectPlatform,
      constructEditorSelectFloorZone,
      constructEditorSelectRoom,
      constructEditorSelectWall,
      constructEditorSetTool,
      constructEditorWallRuns,
      furnishingEditorSelect,
      previewSceneItems,
    ],
  );
  const focusRoom = (roomId: string) => {
    const room = constructEditorPreviewFloor.rooms.find((room) => room.id === roomId);
    if (!room) return;
    setSelectedRoomId(roomId);
    setCameraFocusRoomId(roomId);
    setCameraFocusPoint(roomAnchorForPolygon(room.polygon));
    setCameraResetKey((key) => key + 1);
  };
  return {
    cameraView,
    setCameraView,
    savedCamera,
    cameraResetKey,
    setCameraResetKey,
    cameraFocusRoomId,
    setCameraFocusRoomId,
    cameraFocusPoint,
    setCameraFocusPoint,
    activeIssueKey,
    setActiveIssueKey,
    issueFocusVersion,
    selectedRoomId,
    setSelectedRoomId,
    focusRoom,
    focusIssue,
  };
}

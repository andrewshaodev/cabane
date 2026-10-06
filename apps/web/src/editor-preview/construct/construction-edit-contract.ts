import {
  type DerivedWallRun,
  type FloorCoordinates,
  FloorEditorDraft,
  FloorEditorSelection,
  type FloorEditorSelectionTarget,
  FloorEditorTool,
  type FloorSpec,
  PlanPoint,
  RoomSpec,
} from "@cabane/engine";

import { OpeningTool } from "./construction-pointer-events";

export interface ConstructionEditLayerProps {
  doorConfiguration?: import("@cabane/engine").DoorConfiguration;
  planMode?: boolean;
  referenceWalls?: FloorSpec["walls"];
  draft: FloorEditorDraft;
  coordinates: FloorCoordinates;
  rooms: readonly RoomSpec[];
  selection: FloorEditorSelection;
  deletionTargets?: readonly FloorEditorSelectionTarget[];
  previewFloor?: FloorSpec;
  wallRuns?: readonly DerivedWallRun[];
  tool: FloorEditorTool;
  drawStart?: PlanPoint | null;
  drawPreview?: PlanPoint | null;
  drawAngleReferenceRadians?: number | null;
  wallExteriorColor?: string;
  poolPoints?: readonly PlanPoint[];
  floorPaintTarget?: import("./floor-painting-contract").FloorPaintTarget;
  floorZonePoints?: readonly PlanPoint[];
  floorZonePreview?: PlanPoint | null;
  onCancelFloorZone?: () => void;
  measurePhase?: "idle" | "drawing" | "complete";
  onSelectWall: (id: string) => void;
  onSelectOpening: (id: string) => void;
  onSelectRoom: (id: string) => void;
  onSelectMany?: (targets: readonly FloorEditorSelectionTarget[]) => void;
  onClearSelection?: () => void;
  onMoveEndpoint: (wallId: string, endpoint: "from" | "to", point: PlanPoint) => void;
  onTranslateWall: (wallId: string, delta: PlanPoint) => void;
  onMoveOpening: (openingId: string, wallId: string, offsetPlanUnits: number) => void;
  onResizeOpening: (offsetPlanUnits: number, widthPlanUnits: number) => void;
  onPlaceOpening: (kind: OpeningTool, wallId: string, offsetPlanUnits: number) => void;
  onBeginWall: (point: PlanPoint) => void;
  onPreviewWall: (point: PlanPoint) => void;
  onAddWall: (point: PlanPoint) => void;
  onCancelWall: () => void;
  onPlaceMeasure?: (point: PlanPoint) => void;
  onPreviewMeasure?: (point: PlanPoint) => void;
  onPlaceFloorZonePoint?: (point: PlanPoint) => void;
  onPreviewFloorZonePoint?: (point: PlanPoint) => void;
  onDraggingChange?: (dragging: boolean) => void;
  onMarqueeChange?: (active: boolean) => void;
}

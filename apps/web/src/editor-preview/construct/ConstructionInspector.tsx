import type { ConstructionInspectorProps } from "./construction-inspector-contract";
export type { ConstructionInspectorProps } from "./construction-inspector-contract";
import { EditorButton } from "../../editor-chrome/EditorButton";
import { PlatformProperties } from "./PlatformProperties";
import { FloorToolProperties } from "./FloorToolProperties";
import { DoorPresetPalette } from "./DoorPresetPalette";
import { DoorDesignFields } from "./DoorDesignFields";
import { HedgeProperties } from "./HedgeProperties";
import { ConstructionBuildingSettings } from "./ConstructionBuildingSettings";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";

import { PoolProperties } from "./PoolProperties";

import {
  floorFinishPreset,
  pointInsidePolygon,
  resolveRoomFloorFinish,
  roomInteriorAreaSquareMeters,
} from "@cabane/engine";

import { useMemo } from "react";

import { wallMeasurement } from "./drag-geometry";

import { CommittedTextInput } from "./CommittedTextInput";
import { WallFinishFields } from "./WallFinishFields";
import { DebouncedColorInput } from "./DebouncedColorInput";
import { FloorFinishPalette } from "./FloorFinishPalette";

export function ConstructionInspector({
  inert,
  referencePlanControls,
  planImportControls,
  tutorialControls,
  walkStartControls,
  northControls,
  roof,
  onRoofChange,
  editor,
  floorPainting,
}: ConstructionInspectorProps) {
  const selectedWallId = editor.selection?.kind === "wall" ? editor.selection.id : null;
  const selectedPoolId = editor.selection?.kind === "pool" ? editor.selection.id : null;
  const selectedRoomId = editor.selection?.kind === "room" ? editor.selection.id : null;
  const selectedFloorZoneId = editor.selection?.kind === "floor-zone" ? editor.selection.id : null;
  const selectedWall = selectedWallId
    ? editor.draft.walls.find((wall) => wall.id === selectedWallId)
    : undefined;
  const selectedPool = selectedPoolId
    ? editor.draft.pools?.find((pool) => pool.id === selectedPoolId)
    : undefined;
  const selectedRoom = selectedRoomId
    ? editor.previewFloor.rooms.find((room) => room.id === selectedRoomId)
    : undefined;
  const selectedRoomIdentity = selectedRoom
    ? editor.draft.rooms.find((room) => room.id === selectedRoom.id)
    : undefined;
  const selectedFloorZone = selectedFloorZoneId
    ? [
        ...(editor.draft.groundZones ?? []),
        ...editor.draft.rooms.flatMap((room) => room.floorZones ?? []),
      ].find((zone) => zone.id === selectedFloorZoneId)
    : undefined;
  const mergedRoomIdentities = selectedRoom
    ? editor.draft.rooms.filter((room) => pointInsidePolygon(room.anchor, selectedRoom.polygon))
    : [];
  const roomAreaSquareMeters = useMemo(
    () => (selectedRoom ? roomInteriorAreaSquareMeters(selectedRoom, editor.previewFloor) : 0),
    [selectedRoom, editor.previewFloor],
  );
  const roomCeilingHeight =
    selectedRoomIdentity?.ceilingHeightMeters ?? editor.draft.defaultCeilingHeightMeters;
  const resolvedWall = selectedWall
    ? editor.previewFloor.walls.find((wall) => wall.id === selectedWall.id)
    : undefined;
  const selectedWallIsExterior =
    selectedWall &&
    (resolvedWall?.classification === "exterior" ||
      editor.wallRuns.some(
        (run) => run.sourceWallId === selectedWall.id && run.classification === "exterior",
      ));
  const wallMetrics = selectedWall
    ? wallMeasurement(selectedWall, editor.previewFloor.coordinates)
    : undefined;
  const wallHeight = selectedWall?.heightMeters ?? editor.draft.defaultWallHeightMeters;
  const wallThickness =
    selectedWall?.thicknessMeters ??
    resolvedWall?.thicknessMeters ??
    editor.draft.exteriorWallThicknessMeters;
  const platformId =
    editor.selection?.kind === "outdoor-platform" ? editor.selection.id : undefined;
  const selectedPlatform =
    editor.tool === "select" && platformId
      ? editor.draft.outdoorPlatforms?.find((platform) => platform.id === platformId)
      : undefined;
  const multipleSelection = editor.selection?.kind === "multiple";
  const deletionCounts = useMemo(() => {
    const counts = {
      "outdoor-platform": 0,
      hedge: 0,
      wall: 0,
      opening: 0,
      room: 0,
      pool: 0,
      "floor-zone": 0,
    };
    const seen = new Set<string>();
    for (const target of editor.deletionTargets ?? []) {
      const key = `${target.kind}:${target.id}`;
      if (!seen.has(key)) counts[target.kind]++;
      seen.add(key);
    }
    return counts;
  }, [editor.deletionTargets]);
  const deletionCount = Object.values(deletionCounts).reduce((sum, count) => sum + count, 0);
  return (
    <section className="construction-inspector" aria-label="Construction inspector">
      <div className="construction-inspector__context" inert={inert}>
        <HedgeProperties editor={editor} />
        {(editor.tool === "floor" || editor.tool === "platform") && floorPainting && (
          <FloorToolProperties editor={editor} painting={floorPainting} />
        )}
        {selectedPlatform && <PlatformProperties platform={selectedPlatform} editor={editor} />}
        {editor.tool === "wall" && (
          <div className="construction-inspector__selection">
            <header>
              <div>
                <small>Wall tool</small>
                <strong>Draw walls</strong>
              </div>
            </header>
            <p className="construction-inspector__tool-hint">
              Click and drag a wall segment. Continue from its endpoint to draw a connected wall.
            </p>
            <fieldset>
              <legend>Finish</legend>
              <label>
                Exterior
                <DebouncedColorInput
                  label="New wall exterior color"
                  value={editor.exteriorWallColor}
                  onCommit={(exteriorColor) => {
                    editor.setExteriorWallColor(exteriorColor);
                    if (selectedWall) {
                      editor.updateSelectedWallMetadata({ exteriorColor });
                    }
                  }}
                />
              </label>
            </fieldset>
          </div>
        )}
        {editor.tool === "door" && (
          <div className="construction-inspector__selection">
            <header>
              <div>
                <small>Door tool</small>
                <strong>Place a door</strong>
              </div>
            </header>
            <p className="construction-inspector__tool-hint">
              Choose a door type, then click a wall.
            </p>
            <DoorPresetPalette
              value={editor.doorConfiguration}
              onChange={editor.setDoorConfiguration}
            />
            <DoorDesignFields
              value={editor.doorConfiguration}
              onChange={editor.setDoorConfiguration}
            />
            {editor.openingError && <p role="alert">{editor.openingError}</p>}
          </div>
        )}
        {editor.tool === "niche" && (
          <div className="construction-inspector__selection" role="status">
            <header>
              <div>
                <small>Niche tool</small>
                <strong>Place a niche</strong>
              </div>
            </header>
            <p className="construction-inspector__tool-hint">
              Click a wall face to place a recess. Drag it along the wall and use its handles to
              change the width. Open Details to adjust height, depth and height from floor.
            </p>
            {editor.openingError && <p role="alert">{editor.openingError}</p>}
          </div>
        )}
        {editor.tool === "pool" && (
          <div className="construction-inspector__selection" role="status">
            <header>
              <div>
                <small>Outdoor pool</small>
                <strong>Close the outline</strong>
              </div>
            </header>
            <p className="construction-inspector__tool-hint">
              Click to add corners, then return to the first corner to close the pool. Undo removes
              the last corner. Escape cancels.
            </p>
            {editor.poolDrawing?.error && <p role="alert">{editor.poolDrawing.error}</p>}
            {editor.poolDrawing?.active && (
              <EditorButton variant="secondary" type="button" onClick={editor.poolDrawing.cancel}>
                Cancel pool
              </EditorButton>
            )}
          </div>
        )}
        {editor.tool === "select" && !editor.selection && (
          <div
            className="construction-inspector__selection construction-inspector__selection-hint"
            role="status"
          >
            <header>
              <h3>Edit the plan</h3>
            </header>
            <p className="construction-inspector__tool-hint">
              Select an element to see its properties. Hold Shift and drag to select several; Delete
              or Backspace removes them.
            </p>
          </div>
        )}
        {multipleSelection && (
          <div className="construction-inspector__selection construction-inspector__bulk-selection">
            <header>
              <div>
                <small>Multiple selection</small>
                <strong>{deletionCount} elements selected</strong>
              </div>
            </header>
            <p>
              Whole source walls and their attached openings are included. Shift-drag again to
              replace this selection.
            </p>
            <dl
              className="construction-inspector__bulk-facts"
              aria-label="Elements selected for deletion"
            >
              {deletionCounts.room > 0 && (
                <div>
                  <dt>Rooms</dt>
                  <dd>{deletionCounts.room}</dd>
                </div>
              )}
              {deletionCounts.wall > 0 && (
                <div>
                  <dt>Walls</dt>
                  <dd>{deletionCounts.wall}</dd>
                </div>
              )}
              {deletionCounts.opening > 0 && (
                <div>
                  <dt>Openings</dt>
                  <dd>{deletionCounts.opening}</dd>
                </div>
              )}
              {deletionCounts.hedge > 0 && (
                <div>
                  <dt>Boundaries</dt>
                  <dd>{deletionCounts.hedge}</dd>
                </div>
              )}
              {deletionCounts.pool > 0 && (
                <div>
                  <dt>Pools</dt>
                  <dd>{deletionCounts.pool}</dd>
                </div>
              )}
              {deletionCounts["floor-zone"] > 0 && (
                <div>
                  <dt>Floor areas</dt>
                  <dd>{deletionCounts["floor-zone"]}</dd>
                </div>
              )}
            </dl>
            <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>
              Delete selection
            </EditorButton>
          </div>
        )}
        {selectedPool && <PoolProperties pool={selectedPool} editor={editor} />}
        {selectedFloorZone && (
          <div className="construction-inspector__selection">
            <header>
              <div>
                <small>Selected floor area</small>
                <strong>Floor finish</strong>
              </div>
            </header>
            <FloorFinishPalette
              value={selectedFloorZone.finish}
              onChange={(finish) => editor.updateFloorZone(selectedFloorZone.id, { finish })}
            />
            <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>
              Delete floor area
            </EditorButton>
          </div>
        )}
        {selectedWall && (
          <div className="construction-inspector__selection">
            <header>
              <div>
                <small>Selected wall</small>
                <strong>Wall properties</strong>
              </div>
            </header>
            <dl className="construction-inspector__wall-facts">
              <div>
                <dt>Length</dt>
                <dd>{wallMetrics?.label}</dd>
              </div>
              <div>
                <dt>Direction</dt>
                <dd>{wallMetrics?.directionDegrees.toFixed(1)}°</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{resolvedWall?.classification ?? "Pending"}</dd>
              </div>
            </dl>
            <fieldset>
              <legend>Dimensions · m</legend>
              <label>
                Thickness
                <CommittedNumberInput
                  label="Wall thickness"
                  min={0.04}
                  step={0.01}
                  value={wallThickness}
                  onCommit={(value) =>
                    editor.updateSelectedWallMetadata({ thicknessMeters: value })
                  }
                />
              </label>
              <label>
                Height
                <CommittedNumberInput
                  label="Wall height"
                  min={0.3}
                  step={0.05}
                  value={wallHeight}
                  onCommit={(value) => editor.updateSelectedWallMetadata({ heightMeters: value })}
                />
              </label>
            </fieldset>
            <WallFinishFields
              editor={editor}
              wall={selectedWall}
              isExterior={!!selectedWallIsExterior}
            />
            <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>
              Delete wall
            </EditorButton>
          </div>
        )}
        {selectedRoom && (
          <div className="construction-inspector__selection">
            <header>
              <div>
                <small>Selected room</small>
                <strong>{selectedRoom.name || "Unnamed room"}</strong>
              </div>
              <span
                title="Interior floor area"
                aria-label={`Interior floor area: ${roomAreaSquareMeters.toFixed(1)} square meters`}
              >
                {roomAreaSquareMeters.toFixed(1)} m²
              </span>
            </header>
            {mergedRoomIdentities.length > 1 && (
              <div className="construction-inspector__merge" role="alert">
                <strong>Choose the room to keep</strong>
                <p>This wall change joined existing rooms. Keep one identity before continuing.</p>
                <div>
                  {mergedRoomIdentities.map((identity) => (
                    <EditorButton
                      variant="secondary"
                      key={identity.id}
                      type="button"
                      onClick={() => editor.resolveRoomMerge(identity.id)}
                    >
                      Keep {identity.name || identity.id}
                    </EditorButton>
                  ))}
                </div>
              </div>
            )}
            <fieldset>
              <legend>Room</legend>
              <label>
                Name
                <CommittedTextInput
                  label="Room name"
                  value={selectedRoomIdentity?.name ?? selectedRoom.name}
                  placeholder="e.g. Living room"
                  onCommit={(name) => editor.updateSelectedRoom({ name })}
                />
              </label>
              <label>
                Accent
                <DebouncedColorInput
                  label="Room accent color"
                  value={selectedRoomIdentity?.accent ?? selectedRoom.accent}
                  onCommit={(accent) => editor.updateSelectedRoom({ accent })}
                />
              </label>
            </fieldset>
            <fieldset className="construction-inspector__room-surfaces">
              <legend>Surfaces</legend>
              <div className="construction-inspector__surface-summary">
                <span>Floor</span>
                <strong>
                  {(() => {
                    const finish = resolveRoomFloorFinish(selectedRoom);
                    return finish.kind === "solid"
                      ? "Solid color"
                      : floorFinishPreset(finish.preset).label;
                  })()}
                </strong>
              </div>
              <EditorButton
                variant="secondary"
                type="button"
                onClick={() =>
                  floorPainting
                    ? floorPainting.onTargetChange("room")
                    : editor.setFloorPaintTarget("room")
                }
              >
                Paint floor
              </EditorButton>
              <label>
                Ceiling
                <CommittedNumberInput
                  label="Room ceiling height"
                  min={0.3}
                  step={0.05}
                  value={roomCeilingHeight}
                  onCommit={(ceilingHeightMeters) =>
                    editor.updateSelectedRoom({ ceilingHeightMeters })
                  }
                />
              </label>
            </fieldset>
            {editor.deletionTargets?.some(
              (target) => target.kind === "room" && target.id === selectedRoom.id,
            ) === false && (
              <p role="status">
                All enclosing walls are shared. Edit the walls to remove this room.
              </p>
            )}
            <EditorButton
              variant="text"
              type="button"
              disabled={
                editor.deletionTargets?.some(
                  (target) => target.kind === "room" && target.id === selectedRoom.id,
                ) === false
              }
              onClick={editor.deleteSelected}
            >
              Delete room
            </EditorButton>
          </div>
        )}
      </div>
      {referencePlanControls}
      <ConstructionBuildingSettings
        {...{
          planImportControls,
          roof,
          northControls,
          walkStartControls,
          tutorialControls,
          editor,
        }}
        {...(inert === undefined ? {} : { inert })}
        {...(onRoofChange ? { onRoofChange } : {})}
      />
    </section>
  );
}

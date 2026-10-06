import { OpeningDetails } from "../editor-preview/construct/OpeningDetails";

import { FloorPaintConfirmation } from "../editor-preview/construct";

import { FurnishingInspector } from "../editor-preview/furnish";

import { useHomeEditorController } from "./useHomeEditorController";

type Props = Pick<
  ReturnType<typeof useHomeEditorController>,
  | "mode"
  | "editingLocked"
  | "publishOpen"
  | "previewOpen"
  | "constructEditor"
  | "dragging"
  | "placementFloor"
  | "furnishingModels"
  | "deviceModels"
  | "marqueeSelecting"
  | "selectedOpening"
  | "detailsOpeningId"
  | "setDetailsOpeningId"
  | "visualSceneItems"
  | "furnishingEditor"
  | "selectedItem"
  | "detailsItemId"
  | "setDetailsItemId"
  | "arrangeAnnouncement"
  | "pendingRoomPaintId"
  | "confirmRoomPaint"
  | "setPendingRoomPaintId"
>;
export function EditorSelectionDetails({
  mode,
  editingLocked,
  publishOpen,
  previewOpen,
  constructEditor,
  dragging,
  placementFloor,
  furnishingModels,
  deviceModels,
  marqueeSelecting,
  selectedOpening,
  detailsOpeningId,
  setDetailsOpeningId,
  visualSceneItems,
  furnishingEditor,
  selectedItem,
  detailsItemId,
  setDetailsItemId,
  arrangeAnnouncement,
  pendingRoomPaintId,
  confirmRoomPaint,
  setPendingRoomPaintId,
}: Props) {
  return (
    <>
      {mode === "furnish" && selectedItem && detailsItemId === selectedItem.id && (
        <div inert={editingLocked || publishOpen || previewOpen}>
          <FurnishingInspector
            items={visualSceneItems}
            selectedId={furnishingEditor.selectedId}
            floor={placementFloor}
            onWindowFit={(id, placement, size, definition) => {
              furnishingEditor.beginTransaction();
              furnishingEditor.updatePlacement(id, placement);
              furnishingEditor.updateSize(id, size, definition);
              furnishingEditor.commitTransaction();
            }}
            furnishingModels={furnishingModels}
            deviceModels={deviceModels}
            onPlacementChange={furnishingEditor.updatePlacement}
            onSizeChange={furnishingEditor.updateSize}
            onLightStateChange={furnishingEditor.updateLightState}
            onVariantChange={furnishingEditor.updateVariant}
            onClose={() => setDetailsItemId(null)}
          />
        </div>
      )}
      {mode === "construct" &&
        !marqueeSelecting &&
        selectedOpening &&
        detailsOpeningId === selectedOpening.id && (
          <div inert={editingLocked || publishOpen || previewOpen}>
            <OpeningDetails
              key={selectedOpening.id}
              opening={selectedOpening}
              editor={constructEditor}
              disabled={dragging || editingLocked}
              onClose={() => setDetailsOpeningId(null)}
            />
          </div>
        )}
      <div className="arrange-announcement" role="status">
        {arrangeAnnouncement}
      </div>
      {pendingRoomPaintId &&
        (() => {
          const room = constructEditor.previewFloor.rooms.find(
            (candidate) => candidate.id === pendingRoomPaintId,
          );
          return room ? (
            <FloorPaintConfirmation
              roomName={room.name || "this room"}
              onKeepZones={() => confirmRoomPaint(false)}
              onReplaceEverything={() => confirmRoomPaint(true)}
              onCancel={() => setPendingRoomPaintId(null)}
            />
          ) : null;
        })()}
    </>
  );
}

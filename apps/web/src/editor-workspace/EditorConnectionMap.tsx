import { HomePlanMapping } from "@cabane/engine";
import type { useHomeEditorController } from "./useHomeEditorController";

export function EditorConnectionMap({
  connectFloor,
  connect,
}: Pick<ReturnType<typeof useHomeEditorController>, "connectFloor" | "connect">) {
  return (
    <HomePlanMapping
      floor={connectFloor}
      selectedRoomId={connect.roomId}
      roomDeviceSummaries={connect.roomDeviceSummaries}
      inspectorOpen={false}
      showFitControl={false}
      onActivateRoom={connect.selectRoom}
      connectedRoomIds={
        new Set(
          connectFloor.rooms
            .filter((room) =>
              connect.displayRuntime.areas.some(
                (area) => area.area_id === connect.profile.roomAreaIds[room.id],
              ),
            )
            .map((room) => room.id),
        )
      }
      relationshipLabels={Object.fromEntries(
        connectFloor.rooms.map((room) => [
          room.id,
          connect.displayRuntime.areas.find(
            (area) => area.area_id === connect.profile.roomAreaIds[room.id],
          )?.name ??
            (connect.profile.roomAreaIds[room.id] ? "Saved area unavailable" : "Not connected"),
        ]),
      )}
      roomIcons={Object.fromEntries(
        connectFloor.rooms.map((room) => [
          room.id,
          connect.displayRuntime.areas.find(
            (area) => area.area_id === connect.profile.roomAreaIds[room.id],
          )?.icon ?? null,
        ]),
      )}
    />
  );
}

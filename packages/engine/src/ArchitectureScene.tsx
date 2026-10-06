import { isOutdoorPlatformOutline } from "./outdoor-platforms/platform-geometry";
import { SceneRoomSelection } from "./building/RoomSelectionSurfaces";
import { StairPlan } from "./stairs/models/StairPlan";
import {
  StraightStairModel,
  UShapedStairModel,
  LShapedStairModel,
  SpiralStairModel,
} from "./stairs/models";
import { deriveStairFlight, deriveStairApertures } from "./stairs/flight-geometry";
import { StairSurfaceApertures } from "./stairs/surface-apertures";
import { memo, useMemo } from "react";
import { FloorScene, type FloorSceneProps } from "./building/FloorScene";
import { deriveFloorLevels } from "./building/floor-levels";
import { visibleFloorIds, type FloorView } from "./building/floor-visibility";
import { BuildingRoof } from "./roof";
export { ArchitecturalFloor, ArchitecturalWall } from "./building/FloorScene";

type ArchitectureSceneProps = Omit<
  FloorSceneProps,
  "sourceFloor" | "showGround" | "showCeiling" | "below" | "above" | "platformBelow"
> & {
  selectedRoomId: string | null;
  activeFloorId?: string;
  floorView?: FloorView;
};
export const ArchitectureScene = memo(function ArchitectureScene({
  activeFloorId,
  floorView,
  selectedRoomId,
  ...props
}: ArchitectureSceneProps) {
  const { manifest, walkMode } = props;
  const active =
    activeFloorId ??
    manifest.floors.find((floor) => !floor.belowGround)?.id ??
    manifest.floors[0]?.id;
  const view = walkMode ? "walk" : (floorView ?? "cutaway");
  const visible = new Set(
    visibleFloorIds(
      manifest.floors.map((floor) => floor.id),
      active ?? "",
      view,
    ),
  );
  if (view === "whole")
    manifest.floors
      .filter((floor) => floor.belowGround)
      .forEach((floor) => visible.delete(floor.id));
  const ground = manifest.floors.find(
    (floor) =>
      !floor.belowGround && (floor.elevationMeters === undefined || floor.elevationMeters === 0),
  );
  const apertureKey = JSON.stringify(deriveStairApertures(manifest));
  const aperturesByFloor = useMemo(() => {
    const apertures: ReturnType<typeof deriveStairApertures> = JSON.parse(apertureKey);
    return new Map(
      manifest.floors.map((floor) => [
        floor.id,
        {
          floor: apertures
            .filter((a) => a.floorId === floor.id && a.surface === "floor")
            .map((a) => a.polygon),
          ceiling: [
            ...apertures
              .filter((a) => a.floorId === floor.id && a.surface === "ceiling")
              .map((a) => a.polygon),
            ...(manifest.floors[manifest.floors.indexOf(floor) + 1]?.outdoorPlatforms ?? [])
              .filter((platform) => isOutdoorPlatformOutline(platform.polygon))
              .map((platform) => platform.polygon),
          ],
        },
      ]),
    );
  }, [
    apertureKey,
    JSON.stringify(
      manifest.floors.map((f) => ({ id: f.id, outdoorPlatforms: f.outdoorPlatforms })),
    ),
  ]);
  const floorManifests = useMemo(
    () =>
      new Map(
        manifest.floors.map((floor) => [
          floor.id,
          {
            ...manifest,
            sceneItems: manifest.sceneItems.filter((item) => item.floorId === floor.id),
          },
        ]),
      ),
    [manifest],
  );
  const levels = deriveFloorLevels(manifest.floors);
  const offset =
    props.interactionMode === "editor" && view !== "plan" && view !== "whole"
      ? -(levels.find((level) => level.floorId === active)?.elevationMeters ?? 0)
      : 0;
  // Unshadowed point lights stay on the viewed storey so fixtures below cannot
  // illuminate the floor above.
  return (
    <SceneRoomSelection.Provider value={selectedRoomId}>
      <group name="architecture-scene" position={[0, offset, 0]}>
        {(view === "whole" || view === "walk") && <BuildingRoof manifest={manifest} />}
        {manifest.floors.map(
          (floor, index) =>
            visible.has(floor.id) && (
              <group
                key={floor.id}
                name={`building-floor-${floor.id}`}
                position={[0, view === "plan" ? 0 : levels[index].elevationMeters, 0]}
              >
                <StairSurfaceApertures.Provider value={aperturesByFloor.get(floor.id)!}>
                  <FloorScene
                    {...props}
                    sourceFloor={floor}
                    platformBelow={manifest.floors[index - 1]}
                    sceneLightingEnabled={floor.id === active}
                    below={
                      visible.has(manifest.floors[index - 1]?.id)
                        ? manifest.floors[index - 1]
                        : undefined
                    }
                    above={
                      visible.has(manifest.floors[index + 1]?.id)
                        ? manifest.floors[index + 1]
                        : undefined
                    }
                    showGround={floor === ground && view !== "plan"}
                    showCeiling={view === "walk" || (view === "cutaway" && floor.id !== active)}
                    manifest={floorManifests.get(floor.id)!}
                    interactionMode={floor.id === active ? props.interactionMode : "editor"}
                    onSelectRoom={floor.id === active ? props.onSelectRoom : undefined}
                    onWalkDeviceTargetChange={
                      floor.id === active ? props.onWalkDeviceTargetChange : undefined
                    }
                  />
                </StairSurfaceApertures.Provider>
              </group>
            ),
        )}
        {manifest.stairs.map((stair) => {
          if (
            view === "plan"
              ? stair.lowerFloorId !== active && stair.upperFloorId !== active
              : !visible.has(stair.lowerFloorId)
          )
            return null;
          const flight = deriveStairFlight(manifest, stair);
          if (flight && view === "plan")
            return (
              <StairPlan key={stair.id} flight={flight} upper={stair.upperFloorId === active} />
            );
          if (flight?.shape === "spiral")
            return (
              <SpiralStairModel
                key={stair.id}
                flight={flight}
                coordinates={manifest.coordinates}
                showUpperGuard={visible.has(stair.upperFloorId)}
              />
            );
          if (flight?.shape === "u-shaped")
            return (
              <UShapedStairModel
                key={stair.id}
                flight={flight}
                coordinates={manifest.coordinates}
                showUpperGuard={visible.has(stair.upperFloorId)}
              />
            );
          if (flight?.shape === "l-shaped")
            return (
              <LShapedStairModel
                key={stair.id}
                flight={flight}
                coordinates={manifest.coordinates}
                showUpperGuard={visible.has(stair.upperFloorId)}
              />
            );
          return flight ? (
            <StraightStairModel
              key={stair.id}
              flight={flight}
              plan={view === "plan"}
              showUpperGuard={visible.has(stair.upperFloorId)}
            />
          ) : null;
        })}
      </group>
    </SceneRoomSelection.Provider>
  );
});

import { neutralDemoManifest } from "../../packages/engine/src/demo";
import { parseHomeProjectSchema } from "../../packages/engine/src/home-project/validation";
import type { HomeProject, DraftLayoutFloorSpec } from "../../packages/engine/src/home-project/types";

/** Synthetic legacy input deliberately stays V1 to exercise real migration. */
export const makeLegacyProject = () => {
  const floor = structuredClone(neutralDemoManifest.floors[0]);
  return {
    schemaVersion: 1 as const,
    seedRevision: "multiple-floor-fixture-v1",
    home: { ...neutralDemoManifest.home, id: "multiple-floor-fixture" },
    floor,
    sceneItems: [],
    roomProfiles: {},
    openingProfiles: {},
    shortcuts: [],
    assumptions: [],
  };
};

export const emptyExtensions = { furnishingModels: {}, deviceModels: {}, openingModels: {} };
export const emptyRegistries = { furnishingModels: {}, deviceModels: {} };

export const makeThreeFloorProject = (): HomeProject => {
  const parsed = parseHomeProjectSchema(makeLegacyProject());
  if (!parsed.valid) throw new Error(JSON.stringify(parsed.issues));
  const ground = parsed.project.floors[0];
  const floors = ["ground", "first", "second"].map((prefix): DraftLayoutFloorSpec => {
    const id = (value: string) => `${prefix}-${value}`;
    return {
      ...ground, id: prefix, name: prefix === "ground" ? "Ground floor" : `${prefix} floor`,
      floorToFloorHeightMeters: 2.6,
      rooms: ground.rooms.map((room) => ({ ...room, id: id(room.id) })),
      walls: ground.walls.map((wall) => ({ ...wall, id: id(wall.id) })),
      wallJunctions: ground.wallJunctions.map((junction) => ({ ...junction, id: id(junction.id), wallIds: junction.wallIds.map(id) })),
      openings: ground.openings.map((opening) => ({ ...opening, id: id(opening.id), wallId: id(opening.wallId) })),
      ceilings: ground.ceilings?.map((ceiling) => ({ ...ceiling, id: id(ceiling.id), roomIds: ceiling.roomIds.map(id) })),
    };
  });
  return { ...parsed.project, floors };
};

export const makeStairProject = (): HomeProject => {
  const project = makeThreeFloorProject();
  const point = ([x, z]: readonly [number, number]): readonly [number, number] => [x * 8 / 4.8, z * 8 / 3.6];
  return { ...project, shortcuts: [{ id: "building-walk", action: "walk-mode", context: "both", order: 1 }], floors: project.floors.map((floor) => ({ ...floor,
    footprint: floor.footprint.map(point),
    rooms: floor.rooms.map((room) => ({ ...room, polygon: room.polygon.map(point) as typeof room.polygon })),
    walls: floor.walls.map((wall) => ({ ...wall, from: point(wall.from), to: point(wall.to) })),
    wallJunctions: floor.wallJunctions.map((junction) => ({ ...junction, at: point(junction.at) })),
    openings: [],
  })), stairs: [{ id: "ground-stairs", lowerFloorId: "ground", upperFloorId: "first", at: [4,1.5],
    rotationYRadians: 0, widthMeters: 1.2, runMeters: 4 }] };
};

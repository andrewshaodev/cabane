import { neutralDemoManifest } from "../../packages/engine/src/demo";
import { parseHomeProjectSchema } from "../../packages/engine/src/home-project/validation";
import type {
  HomeProject,
  DraftLayoutFloorSpec,
} from "../../packages/engine/src/home-project/types";

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
      ...ground,
      id: prefix,
      name: prefix === "ground" ? "Ground floor" : `${prefix} floor`,
      floorToFloorHeightMeters: 2.6,
      rooms: ground.rooms.map((room) => ({ ...room, id: id(room.id) })),
      walls: ground.walls.map((wall) => ({ ...wall, id: id(wall.id) })),
      wallJunctions: ground.wallJunctions.map((junction) => ({
        ...junction,
        id: id(junction.id),
        wallIds: junction.wallIds.map(id),
      })),
      openings: ground.openings.map((opening) => ({
        ...opening,
        id: id(opening.id),
        wallId: id(opening.wallId),
      })),
      ceilings: ground.ceilings?.map((ceiling) => ({
        ...ceiling,
        id: id(ceiling.id),
        roomIds: ceiling.roomIds.map(id),
      })),
    };
  });
  return { ...parsed.project, floors };
};

export const makeStairProject = (): HomeProject => {
  const project = makeThreeFloorProject();
  const point = ([x, z]: readonly [number, number]): readonly [number, number] => [
    (x * 8) / 4.8,
    (z * 8) / 3.6,
  ];
  return {
    ...project,
    shortcuts: [{ id: "building-walk", action: "walk-mode", context: "both", order: 1 }],
    floors: project.floors.map((floor) => ({
      ...floor,
      footprint: floor.footprint.map(point),
      rooms: floor.rooms.map((room) => ({
        ...room,
        polygon: room.polygon.map(point) as typeof room.polygon,
      })),
      walls: floor.walls.map((wall) => ({ ...wall, from: point(wall.from), to: point(wall.to) })),
      wallJunctions: floor.wallJunctions.map((junction) => ({
        ...junction,
        at: point(junction.at),
      })),
      openings: [],
    })),
    stairs: [
      {
        id: "ground-stairs",
        lowerFloorId: "ground",
        upperFloorId: "first",
        at: [4, 1.5],
        rotationYRadians: 0,
        widthMeters: 1.2,
        runMeters: 4,
      },
    ],
  };
};

/** Three levels: facade balcony, terrace over a room, and a terrace-only roof level. */
export const makeOutdoorPlatformProject = (): HomeProject => {
  const project = makeStairProject();
  const ground = project.floors[0];
  const platform = (
    id: string,
    polygon: import("../../packages/engine/src/types").Polygon,
    kind: "railing" | "low-wall" = "railing",
  ) => ({
    id,
    polygon,
    finish: { kind: "preset" as const, preset: "travertine" as const },
    defaultEdge: { kind, heightMeters: kind === "railing" ? 1 : 0.3 },
    edges: polygon.map((_, i) => ({ id: `${id}:edge-${i + 1}` })),
  });
  const first = project.floors[1];
  // Narrow the upstairs enclosure, leaving a genuine terrace over the ground room.
  const point = ([x, z]: readonly [number, number]): readonly [number, number] => [x * 0.5, z];
  const narrow = {
    ...first,
    footprint: first.footprint.map(point),
    rooms: first.rooms.map((room) => ({
      ...room,
      polygon: room.polygon.map(point) as typeof room.polygon,
    })),
    walls: first.walls.map((wall) => ({ ...wall, from: point(wall.from), to: point(wall.to) })),
    wallJunctions: first.wallJunctions.map((junction) => ({ ...junction, at: point(junction.at) })),
  };
  const facade = narrow.walls.find(
    (wall) => Math.abs(wall.from[0] - 4) < 0.01 && Math.abs(wall.to[0] - 4) < 0.01,
  )!;
  const balcony = platform("first-balcony", [
    [4, -2],
    [8, -2],
    [8, 0],
    [4, 0],
  ]);
  const terrace = platform(
    "first-terrace",
    [
      [4, 0],
      [8.1, 0],
      [8.1, 8.1],
      [4, 8.1],
    ],
    "low-wall",
  );
  const roof = platform("roof-terrace", [
    [0, 0],
    [4.1, 0],
    [4.1, 8.1],
    [0, 8.1],
  ]);
  return {
    ...project,
    home: { ...project.home, id: "outdoor-platform-fixture", name: "Outdoor platforms" },
    stairs: [],
    floors: [
      ground,
      {
        ...narrow,
        outdoorPlatforms: [balcony, terrace],
        openings: [
          {
            id: "balcony-door",
            kind: "door",
            wallId: facade.id,
            offsetFromWallStartPlanUnits: 1,
            widthPlanUnits: 1,
            sillHeightMeters: 0,
            openingHeightMeters: 2.04,
            operation: "hinged",
            variant: "full-glass",
            finish: "white",
            leafCount: 1,
          },
        ],
      },
      {
        ...project.floors[2],
        name: "Roof terrace",
        footprint: roof.polygon,
        rooms: [],
        walls: [],
        wallJunctions: [],
        openings: [],
        ceilings: [],
        outdoorPlatforms: [roof],
      },
    ],
  };
};

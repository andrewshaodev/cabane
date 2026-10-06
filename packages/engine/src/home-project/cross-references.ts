import type { HomeProject } from "./types";
import { addProjectIssue, type HomeProjectIssue } from "./validation-types";

interface RegisteredId {
  path: string;
  kind: "architecture" | "slot" | "shortcut";
}

export const validateGlobalProjectIds = (
  project: HomeProject,
  issues: HomeProjectIssue[],
) => {
  const ids = new Map<string, RegisteredId>();
  const register = (
    id: string,
    path: string,
    kind: RegisteredId["kind"],
  ) => {
    const prior = ids.get(id);
    if (!prior) {
      ids.set(id, { path, kind });
      return;
    }
    addProjectIssue(
      issues,
      "project.id-duplicate",
      path,
      `ID “${id}” is already used at ${prior.path}.`,
    );
  };

  project.floors.forEach((floor, floorIndex) => {
  register(floor.id, `floors[${floorIndex}].id`, "architecture");
  floor.hedges?.forEach((hedge, index) => register(hedge.id, `floors[${floorIndex}].hedges[${index}].id`, "architecture"));
  floor.pools?.forEach((pool, index) => register(pool.id, `floors[${floorIndex}].pools[${index}].id`, "architecture"));
  floor.groundZones?.forEach((zone, index) => register(zone.id, `floors[${floorIndex}].groundZones[${index}].id`, "architecture"));
  floor.rooms.forEach((room, index) => register(room.id, `floors[${floorIndex}].rooms[${index}].id`, "architecture"));
  floor.walls.forEach((wall, index) => register(wall.id, `floors[${floorIndex}].walls[${index}].id`, "architecture"));
  floor.wallJunctions.forEach((junction, index) => register(junction.id, `floors[${floorIndex}].wallJunctions[${index}].id`, "architecture"));
  floor.openings.forEach((opening, index) => register(opening.id, `floors[${floorIndex}].openings[${index}].id`, "architecture"));
  floor.ceilings?.forEach((ceiling, index) => register(ceiling.id, `floors[${floorIndex}].ceilings[${index}].id`, "architecture"));
  });
  project.stairs.forEach((stair, index) => register(stair.id, `stairs[${index}].id`, "architecture"));

  for (const [roomId, profile] of Object.entries(project.roomProfiles)) {
    profile.dashboardSlots.forEach((slot, index) => register(slot.id, `roomProfiles.${roomId}.dashboardSlots[${index}].id`, "slot"));
  }
  project.sceneItems.forEach((item, itemIndex) => {
    if (item.kind !== "device") return;
    item.entitySlots.forEach((slot, slotIndex) => register(slot.id, `sceneItems[${itemIndex}].entitySlots[${slotIndex}].id`, "slot"));
  });
  for (const [openingId, profile] of Object.entries(project.openingProfiles)) {
    if (profile.coverSlot) register(profile.coverSlot.id, `openingProfiles.${openingId}.coverSlot.id`, "slot");
    if (profile.contactSlot) register(profile.contactSlot.id, `openingProfiles.${openingId}.contactSlot.id`, "slot");
  }
  project.floors.forEach((floor, floorIndex) => floor.openings.forEach((opening, index) => {
    if (opening.kind === "door" && opening.operation === "roll-up" && !project.openingProfiles[opening.id]?.coverSlot) register(`${opening.id}-cover`, `floors[${floorIndex}].openings[${index}].coverSlot`, "slot");
    if (opening.kind !== "passage" && !project.openingProfiles[opening.id]?.contactSlot) {
      register(`${opening.id}-contact`, `floors[${floorIndex}].openings[${index}].contactSlot`, "slot");
    }
  }));
  project.shortcuts.forEach((shortcut, index) => register(shortcut.id, `shortcuts[${index}].id`, "shortcut"));

  project.sceneItems.forEach((item, index) => {
    const prior = ids.get(item.id);
    if (prior) {
      addProjectIssue(
        issues,
        "project.item-id-duplicate",
        `sceneItems[${index}].id`,
        `Scene item id “${item.id}” is already used at ${prior.path}.`,
      );
    } else {
      ids.set(item.id, { path: `sceneItems[${index}].id`, kind: "architecture" });
    }
  });
};

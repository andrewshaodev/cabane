import { keys, record, array, string, polygon } from "./schema-json-values";
import { floorFinish, floorZone } from "./schema-floor-finish";
import { addProjectIssue, type HomeProjectIssue } from "./validation-types";

export const room = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  keys(
    candidate,
    [
      "id",
      "name",
      "polygon",
      "accent",
      "floorFinish",
      "floorZones",
      "dashboardSlots",
      "devices",
      "isSolid",
    ],
    path,
    issues,
  );
  if (candidate.isSolid !== undefined && typeof candidate.isSolid !== "boolean") {
    addProjectIssue(
      issues,
      "project.room-solid",
      `${path}.isSolid`,
      "Not a room must be a boolean.",
    );
  }
  string(candidate.id, `${path}.id`, issues);
  // An unnamed derived room is a valid editable draft. Layout validation
  // still requires a non-empty name before publication.
  if (typeof candidate.name !== "string") string(candidate.name, `${path}.name`, issues);
  polygon(candidate.polygon, `${path}.polygon`, issues);
  string(candidate.accent, `${path}.accent`, issues);
  if (candidate.floorFinish !== undefined) {
    floorFinish(candidate.floorFinish, `${path}.floorFinish`, issues);
  }
  if (candidate.floorZones !== undefined) {
    array(candidate.floorZones, `${path}.floorZones`, issues)?.forEach((zone, index) =>
      floorZone(zone, `${path}.floorZones[${index}]`, issues),
    );
  }
  const slots = array(candidate.dashboardSlots, `${path}.dashboardSlots`, issues);
  if (slots?.length)
    addProjectIssue(
      issues,
      "project.layout-dashboard-slots",
      `${path}.dashboardSlots`,
      "Layout rooms require an empty dashboardSlots array.",
    );
  const devices = array(candidate.devices, `${path}.devices`, issues);
  if (devices?.length)
    addProjectIssue(
      issues,
      "project.layout-devices",
      `${path}.devices`,
      "Layout rooms require an empty devices array.",
    );
};

import { finite } from "./schema-json-values";
import { addProjectIssue, type HomeProjectIssue, type JsonRecord } from "./validation-types";

export function validateHomePosition(home: JsonRecord, issues: HomeProjectIssue[]) {
  if (
    home.apartmentFloor !== undefined &&
    (typeof home.apartmentFloor !== "number" ||
      !Number.isInteger(home.apartmentFloor) ||
      home.apartmentFloor < 0 ||
      home.apartmentFloor > 100)
  )
    addProjectIssue(
      issues,
      "project.apartment-floor",
      "home.apartmentFloor",
      "Choose a whole floor number between 0 and 100.",
    );
  if (home.northAngleDegrees !== undefined) {
    finite(home.northAngleDegrees, "home.northAngleDegrees", issues);
    if (
      typeof home.northAngleDegrees === "number" &&
      (home.northAngleDegrees < 0 || home.northAngleDegrees >= 360)
    )
      addProjectIssue(
        issues,
        "project.north-angle",
        "home.northAngleDegrees",
        "North angle must be at least 0 and less than 360 degrees.",
      );
  }
}

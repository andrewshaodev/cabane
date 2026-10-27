import { keys, record, array, string, finite } from "../home-project/schema-json-values";
import { addProjectIssue, type HomeProjectIssue } from "../home-project/validation-types";
import { CUSTOM_MODEL_LIMITS } from "../imported-models/contracts";
const vector = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const values = array(value, path, issues);
  if (values?.length !== 3)
    addProjectIssue(issues, "project.model-vector", path, "Expected three finite coordinates.");
  values?.forEach((n, i) => finite(n, `${path}[${i}]`, issues));
};

export function validateModelLighting(value: unknown, path: string, issues: HomeProjectIssue[]) {
  const error = (key: string, message: string) =>
    addProjectIssue(issues, "project.model-lighting", `${path}.${key}`, message);
  const light = record(value, path, issues);
  if (light) {
    keys(
      light,
      [
        "position",
        "color",
        "maxIntensity",
        "distance",
        "points",
        "strip",
        "emissiveMaterials",
        "emissiveSurfaces",
        "illuminate",
      ],
      `${path}`,
      issues,
    );
    if (light.illuminate !== undefined && typeof light.illuminate !== "boolean")
      error("illuminate", "Choose whether this model illuminates its surroundings.");
    if (typeof light.color !== "string" || !/^#[0-9a-f]{6}$/i.test(light.color))
      error("color", "Choose a six-digit hex light color.");
    vector(light.position, `${path}.position`, issues);
    string(light.color, `${path}.color`, issues);
    for (const key of ["maxIntensity", "distance"]) {
      finite(light[key], `${path}.${key}`, issues);
      if (Number(light[key]) < 0) error(`${key}`, "Light settings must be non-negative.");
    }
    if (light.points !== undefined) {
      const points = array(light.points, `${path}.points`, issues);
      if (points && points.length >= CUSTOM_MODEL_LIMITS.lightPoints)
        error("points", "Use at most eight light points in total.");
      points?.forEach((point, index) => vector(point, `${path}.points[${index}]`, issues));
    }
    if (light.strip !== undefined) {
      if (light.points !== undefined) error("strip", "Choose points or a strip, not both.");
      const strip = record(light.strip, `${path}.strip`, issues);
      if (strip) {
        keys(strip, ["end", "samples"], `${path}.strip`, issues);
        vector(strip.end, `${path}.strip.end`, issues);
        if (
          !Number.isSafeInteger(strip.samples) ||
          Number(strip.samples) < 2 ||
          Number(strip.samples) > CUSTOM_MODEL_LIMITS.lightPoints
        )
          error("strip.samples", "A strip uses between two and eight samples.");
        if (
          Array.isArray(strip.end) &&
          Array.isArray(light.position) &&
          strip.end.every((n, axis) => n === (light.position as unknown[])[axis])
        )
          error("strip.end", "The strip start and end must differ.");
      }
    }
    for (const field of ["emissiveMaterials", "emissiveSurfaces", "illuminate"])
      if (light[field] !== undefined) {
        const names = array(light[field], `${path}.${field}`, issues);
        if (
          names &&
          (names.length > CUSTOM_MODEL_LIMITS.emissiveMaterials ||
            new Set(names).size !== names.length)
        )
          error(field, "Choose up to sixteen distinct surfaces or material names.");
        names?.forEach((name, index) => {
          if (typeof name !== "string" || !name.trim() || name.length > 128)
            error(
              `${field}[${index}]`,
              "Choose a non-empty material name of at most 128 characters.",
            );
        });
      }
    if (
      Array.isArray(light.emissiveSurfaces) &&
      light.emissiveSurfaces.some((id) => typeof id !== "string" || !/^surface:\d+:\d+$/.test(id))
    )
      error("emissiveSurfaces", "Choose surfaces from the model preview.");
    if (
      (Array.isArray(light.emissiveSurfaces) ? light.emissiveSurfaces.length : 0) +
        (Array.isArray(light.emissiveMaterials) ? light.emissiveMaterials.length : 0) >
      16
    )
      error("emissiveSurfaces", "Choose up to sixteen glowing surfaces and materials in total.");
  }
}

export function validateModelLightOverrides(value: unknown, issues: HomeProjectIssue[]) {
  if (value === undefined) return;
  const lights = record(value, "modelLights", issues);
  if (!lights) return;
  for (const [id, settings] of Object.entries(lights)) {
    if (!id.trim() || id.startsWith("custom:") || id.startsWith("lighting:"))
      addProjectIssue(
        issues,
        "project.model-lighting-id",
        `modelLights.${id}`,
        "Built-in lighting settings need a non-empty native model ID.",
      );
    if (settings !== null) validateModelLighting(settings, `modelLights.${id}`, issues);
  }
}

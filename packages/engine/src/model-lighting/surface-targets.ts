import { CUSTOM_MODEL_LIMITS, type CustomModelLight } from "../imported-models/contracts";

export const MODEL_GLOW_TARGET_LIMIT = CUSTOM_MODEL_LIMITS.emissiveMaterials;
export type ModelGlowSelections = Pick<
  CustomModelLight,
  "glowTargets" | "emissiveSurfaces" | "emissiveMaterials"
>;
export interface ModelLightingSurfaceOption {
  id: string;
  label: string;
  supported: boolean;
  unavailableReason?: string;
  /** Only the verified immutable GLB owner supplies legacy named-material groups. */
  legacyMaterialName?: string;
}
interface UnresolvedModelGlowTarget {
  field: keyof ModelGlowSelections;
  id: string;
  reason: string;
}

export const isModelGlowTargetId = (id: string) =>
  /^native:1:[a-z][a-z0-9.-]{0,79}$/.test(id) || /^glb:1:[a-f0-9]{64}:\d+:\d+:\d+$/.test(id);

/** The selection owner used by lists, picking, highlights and runtime materials. */
export function resolveModelGlowTargets(
  surfaces: readonly ModelLightingSurfaceOption[],
  light: ModelGlowSelections,
) {
  const selected = new Set<string>();
  const unresolved: UnresolvedModelGlowTarget[] = [];
  for (const id of light.glowTargets ?? []) {
    const matches = surfaces.filter((surface) => surface.id === id);
    if (isModelGlowTargetId(id) && matches.length === 1 && matches[0].supported) selected.add(id);
    else
      unresolved.push({
        field: "glowTargets",
        id,
        reason:
          matches[0]?.unavailableReason ??
          "This surface is absent from this variant or state, or belongs to another model asset.",
      });
  }
  for (const id of light.emissiveSurfaces ?? [])
    unresolved.push({
      field: "emissiveSurfaces",
      id,
      reason: "This older surface selection needs review. Remove it and choose the surface again.",
    });
  for (const name of light.emissiveMaterials ?? []) {
    const matches = surfaces.filter(
      (surface) =>
        surface.legacyMaterialName === name &&
        surface.supported &&
        surface.id.startsWith("glb:1:") &&
        isModelGlowTargetId(surface.id),
    );
    if (matches.length) for (const surface of matches) selected.add(surface.id);
    else
      unresolved.push({
        field: "emissiveMaterials",
        id: name,
        reason: "This older material selection is unavailable. Remove it and choose a surface.",
      });
  }
  return { selected: [...selected], unresolved };
}

export const modelGlowTargetCount = (light: ModelGlowSelections) =>
  (light.glowTargets?.length ?? 0) +
  (light.emissiveSurfaces?.length ?? 0) +
  (light.emissiveMaterials?.length ?? 0);

/** A legacy named-material group retains its old meaning and is removed as a group. */
export function toggleModelGlowTarget(
  light: CustomModelLight,
  surfaces: readonly ModelLightingSurfaceOption[],
  id: string,
): CustomModelLight {
  const surface = surfaces.find((surface) => surface.id === id && surface.supported);
  if (!surface || !isModelGlowTargetId(id)) return light;
  const targets = light.glowTargets ?? [];
  const legacy = surface.legacyMaterialName;
  const selectedMaterial = legacy !== undefined && light.emissiveMaterials?.includes(legacy);
  if (selectedMaterial)
    return {
      ...light,
      emissiveMaterials: light.emissiveMaterials!.filter((name) => name !== legacy),
      glowTargets: targets.filter((target) => target !== id),
    };
  if (targets.includes(id))
    return { ...light, glowTargets: targets.filter((target) => target !== id) };
  if (modelGlowTargetCount(light) >= MODEL_GLOW_TARGET_LIMIT) return light;
  return { ...light, glowTargets: [...targets, id] };
}

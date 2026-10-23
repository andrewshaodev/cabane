import type { SupportedServiceCall } from "../home-assistant-controls";
import type { EntityId, HomeAssistantRuntimeSnapshot } from "../types";

/** HA's CLEAN_AREA capability; the robot's physical area is not its cleaning coverage. */
export function areaCleaningVacuums(runtime: HomeAssistantRuntimeSnapshot) {
  return runtime.entityRegistry.filter((entry) => {
    const state = runtime.entityStates[entry.entity_id];
    return (
      entry.entity_id.startsWith("vacuum.") &&
      !entry.disabled_by &&
      !entry.hidden_by &&
      state &&
      (Number(state.attributes.supported_features) & 16384) !== 0
    );
  });
}

export function mappedCleaningAreas(entry: unknown): string[] {
  const options = (entry as { options?: { vacuum?: { area_mapping?: unknown } } } | null)?.options
    ?.vacuum?.area_mapping;
  if (!options || typeof options !== "object" || Array.isArray(options)) return [];
  return Object.entries(options)
    .filter(
      ([, segments]) =>
        Array.isArray(segments) &&
        segments.length > 0 &&
        segments.every((segment) => typeof segment === "string" && segment.length > 0),
    )
    .map(([areaId]) => areaId);
}

export function roomCleanCall(entityId: EntityId, areaId: string): SupportedServiceCall {
  return {
    domain: "vacuum",
    service: "clean_area",
    target: { entity_id: entityId },
    data: { cleaning_area_id: [areaId] },
  };
}

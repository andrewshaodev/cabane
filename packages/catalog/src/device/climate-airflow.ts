export type ClimateAirflowMode = "cool" | "heat" | "dry" | "fan" | "auto";

interface ClimateEntityState {
  state: string;
  attributes?: Readonly<Record<string, unknown>>;
}

const INACTIVE_STATES = new Set([
  "off",
  "idle",
  "standby",
  "unavailable",
  "unknown",
]);

export const deriveClimateAirflowMode = (
  entity: ClimateEntityState | undefined,
): ClimateAirflowMode | null => {
  if (!entity || INACTIVE_STATES.has(entity.state)) {
    return null;
  }

  const action = entity.attributes?.hvac_action;
  if (action === "heating") return "heat";
  if (action === "cooling") return "cool";
  if (action === "drying") return "dry";
  if (action === "fan") return "fan";

  switch (entity.state) {
    case "heat":
      return "heat";
    case "cool":
      return "cool";
    case "dry":
      return "dry";
    case "fan_only":
      return "fan";
    default:
      return "auto";
  }
};

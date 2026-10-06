import type {
  EntityId,
  EntityStateSnapshot,
  HomeAssistantEntityRegistryEntry,
  HomeAssistantRuntimeSnapshot,
} from "../types";

export interface HomePresencePerson {
  readonly entityId: EntityId;
  readonly name: string;
}

export interface HomePresenceSummary {
  readonly state: "present" | "empty" | "unavailable";
  readonly people: readonly HomePresencePerson[];
}

const reliablePersonState = (snapshot: EntityStateSnapshot) =>
  snapshot.available && !snapshot.stale && !["unknown", "unavailable"].includes(snapshot.state);

const readableEntityName = (entityId: EntityId) =>
  entityId
    .slice(entityId.indexOf(".") + 1)
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const personName = (
  snapshot: EntityStateSnapshot,
  registry: HomeAssistantEntityRegistryEntry | undefined,
) => {
  const friendlyName = snapshot.attributes.friendly_name;
  if (typeof friendlyName === "string" && friendlyName.trim()) return friendlyName.trim();
  const registryName = registry?.name ?? registry?.original_name;
  if (registryName?.trim()) return registryName.trim();
  return readableEntityName(snapshot.entityId);
};

export const deriveHomePresence = (
  runtime: HomeAssistantRuntimeSnapshot,
): HomePresenceSummary | null => {
  const registryByEntityId = new Map(
    runtime.entityRegistry.map((entry) => [entry.entity_id, entry]),
  );
  const candidates = Object.values(runtime.entityStates).filter((snapshot) => {
    if (!snapshot.entityId.startsWith("person.")) return false;
    const registry = registryByEntityId.get(snapshot.entityId);
    return !registry?.disabled_by && !registry?.hidden_by;
  });

  if (candidates.length === 0) return null;

  const people = candidates
    .filter((snapshot) => reliablePersonState(snapshot) && snapshot.state === "home")
    .map((snapshot) => ({
      entityId: snapshot.entityId,
      name: personName(snapshot, registryByEntityId.get(snapshot.entityId)),
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en", { sensitivity: "base" }) ||
        left.entityId.localeCompare(right.entityId),
    );

  if (people.length > 0) return { state: "present", people };
  if (candidates.every(reliablePersonState)) return { state: "empty", people: [] };
  return { state: "unavailable", people: [] };
};

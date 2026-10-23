import { useEffect, useState } from "react";
import { useHomeAssistantRuntime } from "../HomeAssistantRuntimeContext";
import { mappedCleaningAreas } from "./room-cleaning";

const cache = new WeakMap<object, WeakMap<object, Map<string, Promise<string[]>>>>();
/** Session- and registry-scoped reads, shared between room and vacuum controls. */
export function useVacuumAreas(ids: string, revision = 0) {
  const { sendStorageMessage, entityRegistry, status } = useHomeAssistantRuntime();
  const [result, setResult] = useState<{
    sender: object;
    registry: object;
    ids: string;
    areas: Map<string, string[]>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setError(null);
    if (!ids || status !== "connected") return;
    let registries = cache.get(sendStorageMessage);
    if (!registries) cache.set(sendStorageMessage, (registries = new WeakMap()));
    let entries = registries.get(entityRegistry);
    if (!entries) registries.set(entityRegistry, (entries = new Map<string, Promise<string[]>>()));
    void Promise.all(
      ids.split(",").map(async (id) => {
        let read = entries.get(id);
        if (!read) {
          read = sendStorageMessage({ type: "config/entity_registry/get", entity_id: id }).then(
            mappedCleaningAreas,
          );
          entries.set(id, read);
          void read.catch(() => entries.delete(id));
        }
        return [id, await read] as const;
      }),
    )
      .then((areas) => {
        if (active)
          setResult({
            sender: sendStorageMessage,
            registry: entityRegistry,
            ids,
            areas: new Map(areas),
          });
      })
      .catch(() => {
        if (active) setError("Could not read cleaning areas. Try again.");
      });
    return () => {
      active = false;
    };
  }, [sendStorageMessage, entityRegistry, status, ids, revision]);
  const areas =
    result?.sender === sendStorageMessage &&
    result.registry === entityRegistry &&
    result.ids === ids
      ? result.areas
      : null;
  return { areas, error };
}

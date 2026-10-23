import { rememberVacuumRoom } from "../vacuum-cleaning-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHomeAssistantRuntime } from "../HomeAssistantRuntimeContext";
import type { EntityId } from "../types";
import { areaCleaningVacuums, mappedCleaningAreas, roomCleanCall } from "./room-cleaning";

export function RoomCleanAction({ areaId, roomId }: { areaId: string; roomId?: string }) {
  const runtime = useHomeAssistantRuntime();
  const candidates = areaCleaningVacuums(runtime);
  const ids = candidates
    .map((entry) => entry.entity_id)
    .sort()
    .join(",");
  const [mapping, setMapping] = useState<{ key: object; areas: Map<EntityId, string[]> } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selected, setSelected] = useState("");
  const inFlight = useRef(false);
  const { entityRegistry, sendStorageMessage, status } = runtime;

  const request = useMemo(
    () => ({ ids, entityRegistry, sendStorageMessage, status }),
    [ids, entityRegistry, sendStorageMessage, status],
  );

  useEffect(() => {
    const { ids, sendStorageMessage, status } = request;
    let active = true;
    setMapping(null);
    setError(null);
    setSent(false);
    if (!ids || status !== "connected") return;
    void Promise.all(
      ids.split(",").map(async (id) => {
        const entry = await sendStorageMessage({
          type: "config/entity_registry/get",
          entity_id: id,
        });
        return [id as EntityId, mappedCleaningAreas(entry)] as const;
      }),
    )
      .then((entries) => {
        if (active) setMapping({ key: request, areas: new Map(entries) });
      })
      .catch(() => {
        if (active) setError("Could not read cleaning areas. Try again.");
      });
    return () => {
      active = false;
    };
  }, [request, revision]);

  const vacuums =
    mapping?.key === request
      ? candidates.filter((entry) => mapping.areas.get(entry.entity_id)?.includes(areaId))
      : [];
  const target =
    vacuums.length === 1 ? vacuums[0] : vacuums.find((entry) => entry.entity_id === selected);
  const state = target && runtime.entityStates[target.entity_id];
  const disabled = !runtime.canMutate || pending || !state?.available || state.stale;
  if (!runtime.areas.some((area) => area.area_id === areaId)) return null;
  if (!ids || (!error && mapping && vacuums.length === 0)) return null;

  async function clean() {
    if (disabled || !target || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setSent(false);
    try {
      await runtime.callService(roomCleanCall(target.entity_id, areaId));
      if (roomId) rememberVacuumRoom(runtime.callService, target.entity_id, roomId);
      setSent(true);
    } catch {
      setError("Cleaning request failed. Try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="room-clean-action">
      {vacuums.length > 1 && (
        <select
          aria-label="Vacuum for room cleaning"
          value={selected}
          disabled={pending}
          onChange={(event) => {
            setSelected(event.target.value);
            setSent(false);
          }}
        >
          <option value="">Choose vacuum</option>
          {vacuums.map((entry) => (
            <option key={entry.entity_id} value={entry.entity_id}>
              {entry.name ?? entry.original_name ?? entry.entity_id}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="room-control-sheet__walk"
        disabled={disabled}
        aria-label="Clean room"
        title="Clean room"
        onClick={() => void clean()}
      >
        {pending ? "Sending…" : "Clean"}
      </button>
      {sent && <span role="status">Cleaning requested</span>}
      {error && (
        <span role="alert">
          {error}
          {!mapping && (
            <button type="button" onClick={() => setRevision((value) => value + 1)}>
              Retry
            </button>
          )}
        </span>
      )}
    </div>
  );
}

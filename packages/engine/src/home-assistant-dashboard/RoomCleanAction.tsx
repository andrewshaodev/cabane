import { rememberVacuumRoom } from "../vacuum-cleaning-location";
import { useRef, useState } from "react";
import { useHomeAssistantRuntime } from "../HomeAssistantRuntimeContext";
import { useVacuumAreas } from "./useVacuumAreas";
import { areaCleaningVacuums, roomCleanCall } from "./room-cleaning";

export function RoomCleanAction({ areaId, roomId }: { areaId: string; roomId?: string }) {
  const runtime = useHomeAssistantRuntime();
  const candidates = areaCleaningVacuums(runtime);
  const ids = candidates
    .map((entry) => entry.entity_id)
    .sort()
    .join(",");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selected, setSelected] = useState("");
  const inFlight = useRef(false);
  const { areas: mapping, error: mappingError } = useVacuumAreas(ids, revision);
  const vacuums = candidates.filter((entry) => mapping?.get(entry.entity_id)?.includes(areaId));
  const target =
    vacuums.length === 1 ? vacuums[0] : vacuums.find((entry) => entry.entity_id === selected);
  const state = target && runtime.entityStates[target.entity_id];
  const disabled = !runtime.canMutate || pending || !state?.available || state.stale;
  if (!runtime.areas.some((area) => area.area_id === areaId)) return null;
  if (!ids || (!mappingError && !error && vacuums.length === 0)) return null;

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
        className="room-control-sheet__walk room-control-sheet__walk-entry"
        disabled={disabled}
        aria-label="Clean room"
        aria-busy={pending}
        title="Clean room"
        onClick={() => void clean()}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="9" r="2" />
          <path d="M8 16h8M4 18l-2 2m18-2 2 2" />
        </svg>
      </button>
      {sent && <span role="status">Cleaning requested</span>}
      {(error || mappingError) && (
        <span role="alert">
          {error || mappingError}
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

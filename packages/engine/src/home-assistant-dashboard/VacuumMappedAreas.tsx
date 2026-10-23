import { useHomeAssistantRuntime } from "../HomeAssistantRuntimeContext";
import type { EntityId } from "../types";
import type { SupportedServiceCall } from "../home-assistant-controls";
import { useVacuumAreas } from "./useVacuumAreas";
import { roomCleanCall } from "./room-cleaning";
import { DomainCommandAction } from "./domain-control-shared";

export function VacuumMappedAreas({
  entityId,
  enabled,
  onCallService,
}: {
  entityId: EntityId;
  enabled: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}) {
  const runtime = useHomeAssistantRuntime();
  const { areas, error } = useVacuumAreas(entityId);
  const mapped = areas?.get(entityId) ?? [];
  return (
    <section className="vacuum-rooms" aria-label="Home Assistant cleaning areas">
      <h3>Clean a room</h3>
      {error ? (
        <p role="alert">{error}</p>
      ) : !areas ? (
        <p>Loading Home Assistant areas…</p>
      ) : mapped.length === 0 ? (
        <p>
          No cleaning areas mapped in Home Assistant for this vacuum. Check its “Map vacuum segments
          to areas” settings.
        </p>
      ) : (
        <div className="vacuum-rooms__grid">
          {mapped.map((id) => {
            const name = runtime.areas.find((area) => area.area_id === id)?.name;
            return name ? (
              <DomainCommandAction
                key={id}
                label={`Clean ${name}`}
                buttonLabel={name}
                confirmedKey={entityId}
                disabled={!enabled}
                call={roomCleanCall(entityId, id)}
                onCallService={onCallService}
              />
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}

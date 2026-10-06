import type { FloorSpec } from "../types";
import { DeviceCategoryIcon } from "../DeviceCategoryIcon";
import { HomeAssistantAreaIcon } from "./HomeAssistantAreaIcon";
import type { DeviceMappingGroupMeta } from "./device-mapping-groups";

export function HomePlanRoomSummary({ room, center, preferredSize, roomIcon, areaLabel, mapped, total, categories }: {
  room: FloorSpec["rooms"][number];
  center: readonly [number, number];
  preferredSize: number;
  roomIcon: string | null;
  areaLabel: string;
  mapped: number;
  total: number;
  categories: readonly DeviceMappingGroupMeta[];
}) {
  const width = Math.max(...room.polygon.map(([x]) => x)) - Math.min(...room.polygon.map(([x]) => x));
  const height = Math.max(...room.polygon.map(([, y]) => y)) - Math.min(...room.polygon.map(([, y]) => y));
  const mappedCount = Math.min(Math.max(mapped, 0), Math.max(total, 0));
  const coveragePercent = total > 0 ? mappedCount / total * 100 : 0;
  const categoryLabel = categories.map((category) => category.label).join(", ");
  // Avoid fractional CSS-pixel layout inside SVG foreignObject (the plan uses meters).
  const scale = Math.min(preferredSize * .65, width * .82 / 12, height * .82 / 6) / 16;
  const labelWidth = Math.min(250, width * .82 / scale);
  return <foreignObject className="home-plan-mapping__room-summary"
    aria-hidden="true"
    transform={`translate(${center[0]} ${center[1]}) scale(${scale})`}
    x={-labelWidth / 2} y={-48} width={labelWidth} height={96}>
    <div className="home-plan-mapping__room-summary-content">
      <div className="home-plan-mapping__summary-name">
        <HomeAssistantAreaIcon icon={roomIcon} className="home-plan-mapping__room-icon" />
        <span>{room.name}</span>
      </div>
      <div className="home-plan-mapping__summary-meta">
        <div className="home-plan-mapping__summary-area" title={areaLabel}>{areaLabel}</div>
        {categories.length > 0 && <div className="home-plan-mapping__device-categories" title={`Device types: ${categoryLabel}`}>
          {categories.map((category) => <span key={category.id} title={category.label}>
            <DeviceCategoryIcon domain={category.iconDomain} size={15} />
          </span>)}
        </div>}
      </div>
      {total > 0 ? <div
        className="home-plan-mapping__device-coverage"
      >
        <div className="home-plan-mapping__coverage-label">
          <strong><span>{mappedCount}</span> / {total}</strong>
          <span>connected</span>
        </div>
        <span className="home-plan-mapping__coverage-track">
          <span style={{ width: `${coveragePercent}%` }} />
        </span>
      </div> : <strong className="home-plan-mapping__no-devices">No devices to connect</strong>}
    </div>
  </foreignObject>;
}

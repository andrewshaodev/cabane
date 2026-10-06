import type {
  HomeAssistantBindingIssue,
  ResolvedEntityBinding,
  ResolvedRoomBindings,
} from "../types";

export type ModulePriority = "primary" | "secondary" | "diagnostic";

export interface RoomModuleViewModel {
  readonly id: string;
  readonly label: string;
  readonly priority: ModulePriority;
  readonly sourceOrder: number;
  readonly deviceSlotId?: string;
  readonly entities: readonly ResolvedEntityBinding[];
  readonly issues: readonly HomeAssistantBindingIssue[];
}

export const priorityRank = (priority: ModulePriority) => ({
  primary: 0,
  secondary: 1,
  diagnostic: 2,
}[priority]);

type DashboardPriority = ModulePriority | "hidden";

export const visiblePriority = (priority: DashboardPriority): ModulePriority =>
  priority === "hidden" ? "secondary" : priority;

const issueCode = (issue: HomeAssistantBindingIssue) => issue.code.replace(/^binding\./, "");

export const safeIssueMessage = (label: string, issue: HomeAssistantBindingIssue) => {
  switch (issueCode(issue)) {
    case "slot-unmapped":
      return `${label} is not connected yet.`;
    case "unavailable":
      return `${label} is currently unavailable.`;
    case "area-mismatch":
      return `${label} is assigned to a different Home Assistant area.`;
    case "domain-incompatible":
      return `${label} is connected to an incompatible entity type.`;
    case "device-class-incompatible":
      return `${label} is connected to an incompatible device type.`;
    case "disabled":
      return `${label} is disabled in Home Assistant.`;
    case "hidden":
      return `${label} is hidden in Home Assistant.`;
    default:
      return `${label} needs its connection reviewed.`;
  }
};

export const buildRoomModules = (resolved: ResolvedRoomBindings): readonly RoomModuleViewModel[] => {
  const deviceModules: RoomModuleViewModel[] = resolved.devices.map((device, sourceOrder) => {
    const primarySlot = device.slot.entitySlots.find((slot) => slot.deviceRole === "primary");
    const displaySlot = primarySlot ?? device.slot.entitySlots[0];
    return {
      id: `device:${device.slot.id}`,
      label: device.displayName ?? displaySlot?.presentation.label ?? device.slot.id,
      priority: displaySlot ? visiblePriority(displaySlot.presentation.dashboardRole) : "secondary",
      sourceOrder,
      deviceSlotId: device.slot.id,
      entities: device.entities,
      issues: device.issues,
    };
  }).filter((module) => module.entities.length > 0);

  const dashboardSlotOrder = new Map(
    resolved.room.dashboardSlots.map((slot, index) => [slot.id, index]),
  );
  const dashboardModules: RoomModuleViewModel[] = [
    ...resolved.sections.primary.map((entity) => ({ entity, priority: "primary" as const })),
    ...resolved.sections.secondary.map((entity) => ({ entity, priority: "secondary" as const })),
    ...resolved.sections.diagnostic.map((entity) => ({ entity, priority: "diagnostic" as const })),
  ].map(({ entity, priority }, flattenedIndex) => {
    const slotOrder = dashboardSlotOrder.get(entity.slotId);
    const sourceOrder = resolved.devices.length + (slotOrder ?? dashboardSlotOrder.size + flattenedIndex);
    return {
      id: `slot:${entity.slotId}`,
      label: entity.label,
      priority,
      sourceOrder,
      entities: [entity],
      issues: entity.issues,
    };
  });

  return [...deviceModules, ...dashboardModules].sort((left, right) =>
    priorityRank(left.priority) - priorityRank(right.priority) || left.sourceOrder - right.sourceOrder,
  );
};

export const focusedDeviceModule = (
  modules: readonly RoomModuleViewModel[],
  deviceSlotId: string | null | undefined,
) => deviceSlotId ? modules.find((module) => module.deviceSlotId === deviceSlotId) : undefined;

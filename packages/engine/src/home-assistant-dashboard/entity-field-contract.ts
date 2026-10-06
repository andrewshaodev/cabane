import {
  toggleEntityCall,
  type SupportedServiceCall
} from "../home-assistant-controls";

import type { EntityStateSnapshot, ResolvedEntityBinding } from "../types";

export interface EntityFieldsProps {
  binding: ResolvedEntityBinding;
  canMutate: boolean;
  focused: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

export const numberAttribute = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const confirmationKey = (entity: EntityStateSnapshot, value: string | number = entity.state) =>
  `${value}:${entity.lastUpdated ?? entity.lastConfirmedAt ?? ""}`;

export const toggleCallForPressed = (entity: EntityStateSnapshot, pressed: boolean) =>
  toggleEntityCall({ ...entity, state: pressed ? "off" : "on" });

export const isVersatileThermostat = (binding: ResolvedEntityBinding) =>
  binding.domain === "climate" && binding.registry?.platform === "versatile_thermostat";

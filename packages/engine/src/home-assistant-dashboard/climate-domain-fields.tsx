import {
  HUMIDIFIER_FEATURE_MODES,
  WATER_HEATER_FEATURE_AWAY_MODE,
  WATER_HEATER_FEATURE_ON_OFF,
  WATER_HEATER_FEATURE_OPERATION_MODE,
  WATER_HEATER_FEATURE_TARGET_TEMPERATURE,
  featureEnabled,
  humidifierHumidityCall,
  humidifierHumidityRange,
  humidifierModeCall,
  humidifierPowerCall,
  stringOptions,
  waterHeaterAwayModeCall,
  waterHeaterOperationModeCall,
  waterHeaterPowerCall,
  waterHeaterTemperatureCall,
  waterHeaterTemperatureRange,
  type SupportedServiceCall,
} from "../home-assistant-controls";
import type { ResolvedEntityBinding } from "../types";
import { CommandRange, CommandToggle } from "./control-primitives";
import {
  DomainCommandOption,
  domainConfirmationKey,
  domainNumberAttribute,
} from "./domain-control-shared";

interface DomainFieldsProps {
  binding: ResolvedEntityBinding;
  enabled: boolean;
  onCallService: (call: SupportedServiceCall) => Promise<unknown>;
}

export function HumidifierFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const range = humidifierHumidityRange(entity);
  const target = domainNumberAttribute(entity.attributes.humidity, range.min);
  const current = Number(entity.attributes.current_humidity);
  const modes = stringOptions(entity.attributes.available_modes ?? entity.attributes.modes);
  const currentMode = String(entity.attributes.mode ?? modes[0] ?? "");
  return (
    <div className="room-module__controls room-module__controls--humidifier">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {Number.isFinite(current) ? `${entity.state} · ${current}% current humidity` : entity.state}
      </output>
      <CommandToggle
        label={binding.label}
        pressed={entity.state !== "off"}
        disabled={!enabled}
        confirmedKey={domainConfirmationKey(entity)}
        callForPressed={(pressed) => humidifierPowerCall(entity, pressed)}
        onCallService={onCallService}
      />
      <CommandRange
        label={`${binding.label} target humidity`}
        min={range.min}
        max={range.max}
        step={range.step}
        confirmedValue={target}
        confirmedKey={domainConfirmationKey(entity, target)}
        disabled={!enabled}
        callForValue={(value) => humidifierHumidityCall(entity, value)}
        onCallService={onCallService}
      />
      {featureEnabled(entity, HUMIDIFIER_FEATURE_MODES) && modes.length > 0 && (
        <DomainCommandOption
          label="Mode"
          value={currentMode}
          options={modes}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity, currentMode)}
          callForValue={(value) => humidifierModeCall(entity, value)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

export function WaterHeaterFields({ binding, enabled, onCallService }: DomainFieldsProps) {
  const entity = binding.state;
  if (!entity) return null;
  const range = waterHeaterTemperatureRange(entity);
  const target = domainNumberAttribute(entity.attributes.temperature, range.min);
  const current = Number(entity.attributes.current_temperature);
  const unit =
    typeof entity.attributes.temperature_unit === "string"
      ? entity.attributes.temperature_unit
      : "°C";
  const operationModes = stringOptions(entity.attributes.operation_list);
  const operationMode = String(entity.attributes.operation_mode ?? entity.state);
  const away = entity.attributes.away_mode === true || entity.attributes.away_mode === "on";
  return (
    <div className="room-module__controls room-module__controls--water-heater">
      <output
        className="room-module__reading"
        aria-label={`${binding.label} status`}
        aria-live="polite"
      >
        {Number.isFinite(current) ? `${current} ${unit} current · ${operationMode}` : operationMode}
      </output>
      {featureEnabled(entity, WATER_HEATER_FEATURE_ON_OFF) && (
        <CommandToggle
          label={binding.label}
          pressed={entity.state !== "off"}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity)}
          callForPressed={(pressed) => waterHeaterPowerCall(entity, pressed)}
          onCallService={onCallService}
        />
      )}
      {featureEnabled(entity, WATER_HEATER_FEATURE_TARGET_TEMPERATURE) && (
        <CommandRange
          label={`${binding.label} target temperature`}
          min={range.min}
          max={range.max}
          step={range.step}
          confirmedValue={target}
          confirmedKey={domainConfirmationKey(entity, target)}
          disabled={!enabled}
          callForValue={(value) => waterHeaterTemperatureCall(entity, value)}
          onCallService={onCallService}
        />
      )}
      {featureEnabled(entity, WATER_HEATER_FEATURE_OPERATION_MODE) && operationModes.length > 0 && (
        <DomainCommandOption
          label="Operation mode"
          value={operationMode}
          options={operationModes}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity, operationMode)}
          callForValue={(value) => waterHeaterOperationModeCall(entity, value)}
          onCallService={onCallService}
        />
      )}
      {featureEnabled(entity, WATER_HEATER_FEATURE_AWAY_MODE) && (
        <CommandToggle
          label={`${binding.label} away mode`}
          pressed={away}
          disabled={!enabled}
          confirmedKey={domainConfirmationKey(entity, away)}
          callForPressed={(pressed) => waterHeaterAwayModeCall(entity, pressed)}
          onCallService={onCallService}
        />
      )}
    </div>
  );
}

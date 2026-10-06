const timestamp = "2026-08-27T10:00:00.000Z";

export const rawEntity = (entityId, state, attributes = {}) => ({
  entity_id: entityId,
  state,
  attributes,
  last_changed: timestamp,
  last_updated: timestamp,
  context: { id: `context-${entityId}`, parent_id: null, user_id: "fixture-user" },
});

export const fixtureAreas = [
  {
    area_id: "demo_room",
    name: "Demo room",
    icon: "mdi:sofa-outline",
    picture: "/api/image/serve/demo-room/original",
    temperature_entity_id: "sensor.demo_temperature",
    humidity_entity_id: "sensor.demo_humidity",
  },
  {
    area_id: "outside",
    name: "Outside fixture area",
    icon: null,
    picture: null,
    temperature_entity_id: null,
    humidity_entity_id: null,
  },
];

export const fixtureDevices = [
  { id: "device-light", area_id: "outside", name: "Ceiling light", name_by_user: null, model: "Fixture light" },
  { id: "device-switch", area_id: "demo_room", name: "Coffee switch", name_by_user: null, model: "Fixture switch" },
  { id: "device-climate", area_id: "demo_room", name: "Climate", name_by_user: null, model: "Fixture climate" },
  { id: "device-cover", area_id: "demo_room", name: "Shade", name_by_user: null, model: "Fixture cover" },
  { id: "device-fan", area_id: "demo_room", name: "Fan", name_by_user: null, model: "Fixture fan" },
  { id: "device-media", area_id: "demo_room", name: "Speaker", name_by_user: null, model: "Fixture speaker" },
  { id: "device-humidifier", area_id: "demo_room", name: "Humidifier", name_by_user: null, model: "Fixture humidifier" },
  { id: "device-water-heater", area_id: "demo_room", name: "Water heater", name_by_user: null, model: "Fixture water heater" },
  { id: "device-vacuum", area_id: "demo_room", name: "Vacuum", name_by_user: null, model: "Fixture vacuum" },
  { id: "device-lock", area_id: "demo_room", name: "Front lock", name_by_user: null, model: "Fixture lock" },
  { id: "device-alarm", area_id: "demo_room", name: "Alarm", name_by_user: null, model: "Fixture alarm" },
  { id: "device-valve", area_id: "demo_room", name: "Water valve", name_by_user: null, model: "Fixture valve" },
  { id: "device-siren", area_id: "demo_room", name: "Siren", name_by_user: null, model: "Fixture siren" },
  { id: "device-select", area_id: "demo_room", name: "Cycle selector", name_by_user: null, model: "Fixture select" },
  { id: "device-number", area_id: "demo_room", name: "Cycle level", name_by_user: null, model: "Fixture number" },
  { id: "device-button", area_id: "demo_room", name: "Start cycle", name_by_user: null, model: "Fixture button" },
];

const registryEntry = (entityId, deviceId = null, areaId = null, overrides = {}) => ({
  entity_id: entityId,
  area_id: areaId,
  device_id: deviceId,
  platform: "fixture_integration",
  disabled_by: null,
  hidden_by: null,
  name: null,
  original_name: entityId.split(".")[1].replaceAll("_", " "),
  ...overrides,
});

export const fixtureEntityRegistry = [
  registryEntry("light.demo_ceiling", "device-light", "demo_room"),
  registryEntry("switch.demo_coffee", "device-switch"),
  registryEntry("input_boolean.demo_quiet", null, "demo_room"),
  registryEntry("climate.demo", "device-climate", null, { platform: "versatile_thermostat" }),
  registryEntry("cover.demo_shade", "device-cover"),
  registryEntry("fan.demo", "device-fan"),
  registryEntry("media_player.demo_speaker", "device-media"),
  registryEntry("humidifier.demo", "device-humidifier"),
  registryEntry("water_heater.demo", "device-water-heater"),
  registryEntry("vacuum.demo", "device-vacuum", null, { platform: "dreame_vacuum" }),
  registryEntry("lock.demo_front_door", "device-lock"),
  registryEntry("alarm_control_panel.demo", "device-alarm"),
  registryEntry("valve.demo_water", "device-valve"),
  registryEntry("siren.demo", "device-siren"),
  registryEntry("select.demo_cycle", "device-select"),
  registryEntry("number.demo_level", "device-number"),
  registryEntry("button.demo_start", "device-button"),
  registryEntry("sensor.demo_temperature", null, "demo_room"),
  registryEntry("sensor.demo_humidity", null, "demo_room"),
  registryEntry("binary_sensor.demo_window", null, "demo_room"),
  registryEntry("light.unmodeled_path", null, "outside"),
];

export const fixtureRawStates = {
  "light.demo_ceiling": rawEntity("light.demo_ceiling", "on", {
    friendly_name: "Ceiling light",
    brightness: 128,
    supported_color_modes: ["brightness"],
  }),
  "switch.demo_coffee": rawEntity("switch.demo_coffee", "off", { friendly_name: "Coffee switch" }),
  "input_boolean.demo_quiet": rawEntity("input_boolean.demo_quiet", "on", { friendly_name: "Quiet mode" }),
  "climate.demo": rawEntity("climate.demo", "heat", {
    friendly_name: "Room climate",
    supported_features: 57,
    temperature: 20.5,
    current_temperature: 19.7,
    regulated_target_temperature: 22.5,
    temperature_unit: "°C",
    min_temp: 7,
    max_temp: 30,
    target_temp_step: 0.5,
    hvac_action: "heating",
    hvac_modes: ["off", "heat", "cool"],
    preset_mode: "home",
    preset_modes: ["home", "eco"],
    fan_mode: "auto",
    fan_modes: ["auto", "low"],
    swing_mode: "off",
    swing_modes: ["off", "vertical"],
    is_over_climate: true,
    is_regulated: true,
    presence_state: "on",
    motion_state: "off",
    window_state: "off",
    is_window_bypass: false,
    overpowering_state: "off",
    safety_state: "off",
  }),
  "cover.demo_shade": rawEntity("cover.demo_shade", "open", {
    friendly_name: "Window shade",
    supported_features: 15,
    current_position: 62,
  }),
  "fan.demo": rawEntity("fan.demo", "on", {
    friendly_name: "Room fan",
    percentage: 40,
    speed_count: 10,
    preset_mode: "normal",
    preset_modes: ["normal", "breeze"],
  }),
  "media_player.demo_speaker": rawEntity("media_player.demo_speaker", "playing", {
    friendly_name: "Room speaker",
    supported_features: 16389,
    volume_level: 0.35,
  }),
  "humidifier.demo": rawEntity("humidifier.demo", "on", {
    friendly_name: "Room humidifier",
    supported_features: 1,
    current_humidity: 43,
    humidity: 50,
    min_humidity: 30,
    max_humidity: 70,
    target_humidity_step: 5,
    mode: "normal",
    available_modes: ["normal", "eco", "boost"],
  }),
  "water_heater.demo": rawEntity("water_heater.demo", "eco", {
    friendly_name: "Water heater",
    supported_features: 15,
    current_temperature: 51,
    temperature: 55,
    min_temp: 40,
    max_temp: 75,
    target_temp_step: 5,
    temperature_unit: "°C",
    operation_mode: "eco",
    operation_list: ["eco", "performance"],
    away_mode: false,
  }),
  "vacuum.demo": rawEntity("vacuum.demo", "docked", {
    friendly_name: "Robot vacuum",
    supported_features: 8252,
    fan_speed: "standard",
    fan_speed_list: ["quiet", "standard", "turbo"],
    battery_level: 86,
    selected_map: "Ground floor",
    rooms: {
      "Ground floor": [
        { id: 8, name: "Kitchen" },
        { id: 6, name: "" },
      ],
    },
  }),
  "lock.demo_front_door": rawEntity("lock.demo_front_door", "locked", {
    friendly_name: "Front door lock",
    supported_features: 1,
    code_format: "^\\d{4}$",
  }),
  "alarm_control_panel.demo": rawEntity("alarm_control_panel.demo", "disarmed", {
    friendly_name: "Home alarm",
    supported_features: 55,
    code_format: "^\\d{4}$",
    code_arm_required: true,
  }),
  "valve.demo_water": rawEntity("valve.demo_water", "open", {
    friendly_name: "Main water valve",
    supported_features: 15,
    current_position: 62,
  }),
  "siren.demo": rawEntity("siren.demo", "off", {
    friendly_name: "Indoor siren",
    supported_features: 31,
    available_tones: ["alarm", "chime"],
  }),
  "select.demo_cycle": rawEntity("select.demo_cycle", "normal", {
    friendly_name: "Washer cycle",
    options: ["delicate", "normal", "intensive"],
  }),
  "number.demo_level": rawEntity("number.demo_level", "40", {
    friendly_name: "Washer level",
    min: 10,
    max: 90,
    step: 5,
    unit_of_measurement: "%",
  }),
  "button.demo_start": rawEntity("button.demo_start", timestamp, {
    friendly_name: "Start washer",
    device_class: "restart",
  }),
  "sensor.demo_temperature": rawEntity("sensor.demo_temperature", "19.7", {
    friendly_name: "Temperature",
    device_class: "temperature",
    unit_of_measurement: "°C",
  }),
  "sensor.demo_humidity": rawEntity("sensor.demo_humidity", "48", {
    friendly_name: "Humidity",
    device_class: "humidity",
    unit_of_measurement: "%",
  }),
  "binary_sensor.demo_window": rawEntity("binary_sensor.demo_window", "on", {
    friendly_name: "Window contact",
    device_class: "window",
  }),
  "light.unmodeled_path": rawEntity("light.unmodeled_path", "off", {
    friendly_name: "Unmodeled path light",
    supported_color_modes: ["onoff"],
  }),
  "sun.sun": rawEntity("sun.sun", "above_horizon", { azimuth: 174, elevation: 31 }),
};

export const toSnapshots = (rawStates = fixtureRawStates, stale = false) => Object.fromEntries(
  Object.values(rawStates).map((entity) => [entity.entity_id, {
    entityId: entity.entity_id,
    state: entity.state,
    attributes: structuredClone(entity.attributes),
    available: !["unknown", "unavailable"].includes(entity.state),
    stale,
    lastConfirmedAt: entity.last_updated,
    lastChanged: entity.last_changed,
    lastUpdated: entity.last_updated,
  }]),
);

export const connectedRuntimeFixture = (overrides = {}) => ({
  status: "connected",
  configured: true,
  canMutate: true,
  origin: "http://fixture-ha.local:8123",
  error: null,
  areas: structuredClone(fixtureAreas),
  devices: structuredClone(fixtureDevices),
  entityRegistry: structuredClone(fixtureEntityRegistry),
  entityStates: toSnapshots(),
  ...overrides,
});

export const connectedManifestFixture = (neutralDemoManifest) => {
  const manifest = structuredClone(neutralDemoManifest);
  const room = manifest.floors[0].rooms[0];
  const slot = (id, domains, label, dashboardRole, overrides = {}) => ({
    id,
    compatibleDomains: domains,
    required: false,
    autoMap: "unique-compatible",
    presentation: { label, dashboardRole },
    ...overrides,
  });
  room.dashboardSlots = [
    slot("demo-climate-slot", ["climate"], "Room climate", "primary"),
    slot("demo-coffee-slot", ["switch"], "Coffee switch", "secondary"),
    slot("demo-quiet-slot", ["input_boolean"], "Quiet mode", "secondary"),
    slot("demo-cover-slot", ["cover"], "Window shade", "secondary"),
    slot("demo-fan-slot", ["fan"], "Room fan", "secondary"),
    slot("demo-temperature-slot", ["sensor"], "Temperature", "diagnostic", {
      compatibleDeviceClasses: ["temperature"],
    }),
    slot("demo-humidifier-slot", ["humidifier"], "Humidifier", "secondary"),
    slot("demo-water-heater-slot", ["water_heater"], "Water heater", "secondary"),
    slot("demo-vacuum-slot", ["vacuum"], "Vacuum", "secondary"),
    slot("demo-lock-slot", ["lock"], "Front lock", "secondary"),
    slot("demo-alarm-slot", ["alarm_control_panel"], "Alarm", "secondary"),
    slot("demo-valve-slot", ["valve"], "Water valve", "secondary"),
    slot("demo-siren-slot", ["siren"], "Siren", "secondary"),
    slot("demo-select-slot", ["select"], "Cycle", "secondary"),
    slot("demo-number-slot", ["number"], "Level", "secondary"),
    slot("demo-button-slot", ["button"], "Start", "secondary"),
  ];
  room.devices = [
    {
      id: "fixture-light-device",
      model: "wall-switch",
      entitySlots: [slot("demo-main-light-slot", ["light"], "Main ceiling", "primary", {
        required: true,
        deviceRole: "primary",
      })],
      placement: {
        at: [2.4, 0.094],
        elevationMeters: 1.1,
        rotationYRadians: 0,
        support: { kind: "wall", wallId: "north-wall" },
      },
    },
    {
      id: "fixture-speaker-device",
      model: "speaker",
      entitySlots: [slot("demo-speaker-slot", ["media_player"], "Speaker", "secondary", {
        deviceRole: "primary",
      })],
      placement: {
        at: [3.8, 1.8],
        elevationMeters: 0.8,
        support: { kind: "surface" },
      },
    },
  ];
  manifest.floors[0].openings[1].contactSlot = {
    id: "demo-window-contact-slot",
    compatibleDeviceClasses: ["window", "opening"],
    openState: "on",
    autoMap: "unique-compatible",
  };
  return manifest;
};

export const connectedProfileFixture = () => ({
  schemaVersion: 1,
  homeId: "neutral-demo",
  roomAreaIds: { "demo-room": "demo_room" },
  entityIdsBySlotId: {
    "demo-climate-slot": "climate.demo",
    "demo-coffee-slot": "switch.demo_coffee",
    "demo-quiet-slot": "input_boolean.demo_quiet",
    "demo-cover-slot": "cover.demo_shade",
    "demo-fan-slot": "fan.demo",
    "demo-temperature-slot": "sensor.demo_temperature",
    "demo-main-light-slot": "light.demo_ceiling",
    "demo-speaker-slot": "media_player.demo_speaker",
    "demo-window-contact-slot": "binary_sensor.demo_window",
    "demo-humidifier-slot": "humidifier.demo",
    "demo-water-heater-slot": "water_heater.demo",
    "demo-vacuum-slot": "vacuum.demo",
    "demo-lock-slot": "lock.demo_front_door",
    "demo-alarm-slot": "alarm_control_panel.demo",
    "demo-valve-slot": "valve.demo_water",
    "demo-siren-slot": "siren.demo",
    "demo-select-slot": "select.demo_cycle",
    "demo-number-slot": "number.demo_level",
    "demo-button-slot": "button.demo_start",
  },
});

export const functionalMappingManifestFixture = (neutralDemoManifest) => {
  const manifest = connectedManifestFixture(neutralDemoManifest);
  const room = manifest.floors[0].rooms[0];
  const slot = (id, domains, label, overrides = {}) => ({
    id,
    compatibleDomains: domains,
    required: false,
    autoMap: "unique-compatible",
    presentation: { label, dashboardRole: "secondary" },
    ...overrides,
  });
  room.dashboardSlots = [
    slot("fixture-light-slot", ["light"], "Ambient light"),
    slot("fixture-climate-slot", ["climate"], "Thermostat"),
    slot("fixture-fan-slot", ["fan"], "Ceiling fan"),
    slot("fixture-temperature-slot", ["sensor"], "Temperature", {
      compatibleDeviceClasses: ["temperature"],
    }),
    slot("fixture-humidity-slot", ["sensor"], "Humidity", {
      compatibleDeviceClasses: ["humidity"],
    }),
    slot("fixture-media-slot", ["media_player"], "Speaker"),
    slot("fixture-cover-slot", ["cover"], "Shade"),
    slot("fixture-sensor-slot", ["sensor"], "Air quality"),
    slot("fixture-binary-slot", ["binary_sensor"], "Presence"),
    slot("fixture-switch-slot", ["switch"], "Coffee switch"),
    slot("fixture-input-slot", ["input_boolean"], "Quiet mode"),
    slot("fixture-humidifier-control-slot", ["humidifier"], "Humidifier"),
    slot("fixture-water-heater-control-slot", ["water_heater"], "Water heater"),
    slot("fixture-vacuum-control-slot", ["vacuum"], "Vacuum"),
    slot("fixture-lock-control-slot", ["lock"], "Front lock"),
    slot("fixture-alarm-control-slot", ["alarm_control_panel"], "Alarm"),
    slot("fixture-valve-control-slot", ["valve"], "Water valve"),
    slot("fixture-siren-control-slot", ["siren"], "Siren"),
    slot("fixture-select-control-slot", ["select"], "Cycle"),
    slot("fixture-number-control-slot", ["number"], "Level"),
    slot("fixture-button-control-slot", ["button"], "Start"),
  ];
  room.devices = [{
    id: "fixture-combined-device",
    model: "indoor-ac",
    entitySlots: [
      slot("fixture-device-secondary-light", ["light"], "Display light", {
        deviceRole: "secondary",
      }),
      slot("fixture-device-primary-climate", ["climate"], "Indoor AC", {
        deviceRole: "primary",
      }),
    ],
    placement: {
      at: [2.4, 0.094],
      elevationMeters: 2.1,
      rotationYRadians: 0,
      support: { kind: "wall", wallId: "north-wall" },
    },
  }];
  return manifest;
};

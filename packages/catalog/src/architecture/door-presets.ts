import { DEFAULT_DOOR_CONFIGURATION, type DoorConfiguration } from "@cabane/engine";

export const DOOR_PRESETS = [
  { id: "panel-wood", label: "Panel wood", configuration: DEFAULT_DOOR_CONFIGURATION },
  {
    id: "panel-white",
    label: "Panel white",
    configuration: {
      kind: "door",
      operation: "hinged",
      variant: "panel",
      finish: "white",
      leafCount: 1,
      widthMeters: 0.9,
      heightMeters: 2.04,
    },
  },
  {
    id: "french",
    label: "French",
    configuration: {
      kind: "door",
      operation: "hinged",
      variant: "french",
      finish: "white",
      leafCount: 2,
      widthMeters: 1.6,
      heightMeters: 2.04,
    },
  },
  {
    id: "full-glass",
    label: "Full glass",
    configuration: {
      kind: "door",
      operation: "hinged",
      variant: "full-glass",
      finish: "white",
      leafCount: 1,
      widthMeters: 0.9,
      heightMeters: 2.04,
    },
  },
  {
    id: "sliding-wood",
    label: "Sliding wood",
    configuration: {
      kind: "door",
      operation: "sliding",
      variant: "plank",
      finish: "wood",
      leafCount: 1,
      widthMeters: 0.9,
      heightMeters: 2.04,
    },
  },
  {
    id: "garage-door",
    label: "Garage door",
    configuration: {
      kind: "door",
      operation: "roll-up",
      variant: "slatted",
      finish: "white",
      widthMeters: 2.4,
      heightMeters: 2.1,
    },
  },
] as const satisfies readonly { id: string; label: string; configuration: DoorConfiguration }[];

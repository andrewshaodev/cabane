import { keys, record, array, string } from "./schema-json-values";
import { doorDesignErrors } from "../door-design-validation";
import { validHedge } from "../hedges/hedge-validity";
import type { HedgeSpec } from "../types";
import { FLOOR_PATTERN_PRESET_IDS, type DeviceDomain } from "../types";
import type { HomeProject, LegacyHomeProject } from "./types";
import { addProjectIssue, isPlainRecord, type HomeProjectIssue } from "./validation-types";

const DEVICE_DOMAINS = new Set<DeviceDomain>([
  "light",
  "switch",
  "input_boolean",
  "climate",
  "cover",
  "fan",
  "media_player",
  "humidifier",
  "water_heater",
  "vacuum",
  "lock",
  "alarm_control_panel",
  "valve",
  "siren",
  "select",
  "number",
  "button",
  "camera",
  "sensor",
  "binary_sensor",
]);
const FLOOR_PRESETS = new Set<string>(FLOOR_PATTERN_PRESET_IDS);

const finite = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  if (typeof value === "number" && Number.isFinite(value)) return;
  addProjectIssue(issues, "project.number", path, "Expected a finite number.");
};

const point = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = array(value, path, issues);
  if (!candidate) return;
  if (candidate.length !== 2) {
    addProjectIssue(
      issues,
      "project.plan-point",
      path,
      "A plan point requires exactly two numbers.",
    );
    return;
  }
  candidate.forEach((entry, index) => finite(entry, `${path}[${index}]`, issues));
};

const polygon = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = array(value, path, issues);
  if (!candidate) return;
  if (candidate.length < 3) {
    addProjectIssue(issues, "project.polygon", path, "A polygon requires at least three points.");
  }
  candidate.forEach((entry, index) => point(entry, `${path}[${index}]`, issues));
};

const floorFinish = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  if (candidate.kind === "solid") {
    keys(candidate, ["kind", "color"], path, issues);
    string(candidate.color, `${path}.color`, issues);
    return;
  }
  if (candidate.kind === "preset") {
    keys(candidate, ["kind", "preset"], path, issues);
    if (!FLOOR_PRESETS.has(String(candidate.preset))) {
      addProjectIssue(
        issues,
        "project.floor-preset",
        `${path}.preset`,
        "Floor preset is not supported.",
      );
    }
    return;
  }
  keys(candidate, ["kind"], path, issues);
  addProjectIssue(
    issues,
    "project.floor-finish-kind",
    `${path}.kind`,
    "Floor finish kind must be solid or preset.",
  );
};

const floorZone = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  keys(candidate, ["id", "polygon", "finish"], path, issues);
  string(candidate.id, `${path}.id`, issues);
  polygon(candidate.polygon, `${path}.polygon`, issues);
  floorFinish(candidate.finish, `${path}.finish`, issues);
};

const stringArray = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  array(value, path, issues)?.forEach((entry, index) => string(entry, `${path}[${index}]`, issues));
};

const entitySlot = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const slot = record(value, path, issues);
  if (!slot) return;
  keys(
    slot,
    [
      "id",
      "compatibleDomains",
      "compatibleDeviceClasses",
      "required",
      "autoMap",
      "deviceRole",
      "presentation",
      "sceneLight",
    ],
    path,
    issues,
  );
  string(slot.id, `${path}.id`, issues);
  array(slot.compatibleDomains, `${path}.compatibleDomains`, issues)?.forEach((domain, index) => {
    if (!DEVICE_DOMAINS.has(domain as DeviceDomain)) {
      addProjectIssue(
        issues,
        "project.slot-domain",
        `${path}.compatibleDomains[${index}]`,
        "Entity slot domain is not supported.",
      );
    }
  });
  if (slot.compatibleDeviceClasses !== undefined) {
    stringArray(slot.compatibleDeviceClasses, `${path}.compatibleDeviceClasses`, issues);
  }
  if (typeof slot.required !== "boolean") {
    addProjectIssue(
      issues,
      "project.boolean",
      `${path}.required`,
      "Slot required must be boolean.",
    );
  }
  if (!["unique-compatible", "manual"].includes(String(slot.autoMap))) {
    addProjectIssue(issues, "project.slot-auto-map", `${path}.autoMap`, "Slot autoMap is invalid.");
  }
  if (
    slot.deviceRole !== undefined &&
    !["primary", "secondary"].includes(typeof slot.deviceRole === "string" ? slot.deviceRole : "")
  ) {
    addProjectIssue(
      issues,
      "project.slot-role",
      `${path}.deviceRole`,
      "Slot deviceRole is invalid.",
    );
  }
  const presentation = record(slot.presentation, `${path}.presentation`, issues);
  if (presentation) {
    keys(presentation, ["label", "dashboardRole"], `${path}.presentation`, issues);
    string(presentation.label, `${path}.presentation.label`, issues);
    if (
      !["primary", "secondary", "diagnostic", "hidden"].includes(String(presentation.dashboardRole))
    ) {
      addProjectIssue(
        issues,
        "project.slot-dashboard-role",
        `${path}.presentation.dashboardRole`,
        "Slot dashboardRole is invalid.",
      );
    }
  }
  if (slot.sceneLight !== undefined) {
    const light = record(slot.sceneLight, `${path}.sceneLight`, issues);
    if (light) {
      keys(
        light,
        ["at", "elevationMeters", "color", "maxIntensity", "distance"],
        `${path}.sceneLight`,
        issues,
      );
      point(light.at, `${path}.sceneLight.at`, issues);
      finite(light.elevationMeters, `${path}.sceneLight.elevationMeters`, issues);
      string(light.color, `${path}.sceneLight.color`, issues);
      finite(light.maxIntensity, `${path}.sceneLight.maxIntensity`, issues);
      finite(light.distance, `${path}.sceneLight.distance`, issues);
    }
  }
};

const contactSlot = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const slot = record(value, path, issues);
  if (!slot) return;
  keys(slot, ["id", "compatibleDeviceClasses", "openState", "autoMap"], path, issues);
  string(slot.id, `${path}.id`, issues);
  array(slot.compatibleDeviceClasses, `${path}.compatibleDeviceClasses`, issues)?.forEach(
    (entry, index) => {
      if (!["door", "window", "opening"].includes(String(entry))) {
        addProjectIssue(
          issues,
          "project.contact-class",
          `${path}.compatibleDeviceClasses[${index}]`,
          "Opening contact device class is invalid.",
        );
      }
    },
  );
  if (!["on", "off"].includes(String(slot.openState))) {
    addProjectIssue(
      issues,
      "project.contact-open-state",
      `${path}.openState`,
      "Contact openState is invalid.",
    );
  }
  if (!["unique-compatible", "manual"].includes(String(slot.autoMap))) {
    addProjectIssue(
      issues,
      "project.contact-auto-map",
      `${path}.autoMap`,
      "Contact autoMap is invalid.",
    );
  }
};

const room = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  keys(
    candidate,
    ["id", "name", "polygon", "accent", "floorFinish", "floorZones", "dashboardSlots", "devices"],
    path,
    issues,
  );
  string(candidate.id, `${path}.id`, issues);
  // An unnamed derived room is a valid editable draft. Layout validation
  // still requires a non-empty name before publication.
  if (typeof candidate.name !== "string") string(candidate.name, `${path}.name`, issues);
  polygon(candidate.polygon, `${path}.polygon`, issues);
  string(candidate.accent, `${path}.accent`, issues);
  if (candidate.floorFinish !== undefined) {
    floorFinish(candidate.floorFinish, `${path}.floorFinish`, issues);
  }
  if (candidate.floorZones !== undefined) {
    array(candidate.floorZones, `${path}.floorZones`, issues)?.forEach((zone, index) =>
      floorZone(zone, `${path}.floorZones[${index}]`, issues),
    );
  }
  const slots = array(candidate.dashboardSlots, `${path}.dashboardSlots`, issues);
  if (slots?.length)
    addProjectIssue(
      issues,
      "project.layout-dashboard-slots",
      `${path}.dashboardSlots`,
      "Layout rooms require an empty dashboardSlots array.",
    );
  const devices = array(candidate.devices, `${path}.devices`, issues);
  if (devices?.length)
    addProjectIssue(
      issues,
      "project.layout-devices",
      `${path}.devices`,
      "Layout rooms require an empty devices array.",
    );
};

const wall = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  keys(
    candidate,
    [
      "id",
      "from",
      "to",
      "classification",
      "thicknessMeters",
      "heightMeters",
      "exteriorColor",
      "faceColors",
    ],
    path,
    issues,
  );
  string(candidate.id, `${path}.id`, issues);
  point(candidate.from, `${path}.from`, issues);
  point(candidate.to, `${path}.to`, issues);
  if (!["interior", "exterior"].includes(String(candidate.classification))) {
    addProjectIssue(
      issues,
      "project.wall-classification",
      `${path}.classification`,
      "Wall classification is invalid.",
    );
  }
  finite(candidate.thicknessMeters, `${path}.thicknessMeters`, issues);
  if (candidate.heightMeters !== undefined)
    finite(candidate.heightMeters, `${path}.heightMeters`, issues);
  if (candidate.exteriorColor !== undefined)
    string(candidate.exteriorColor, `${path}.exteriorColor`, issues);
  if (candidate.faceColors !== undefined) {
    const colors = record(candidate.faceColors, `${path}.faceColors`, issues);
    if (colors) {
      keys(colors, ["left", "right"], `${path}.faceColors`, issues);
      if (colors.left !== undefined) string(colors.left, `${path}.faceColors.left`, issues);
      if (colors.right !== undefined) string(colors.right, `${path}.faceColors.right`, issues);
    }
  }
};

const opening = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  const base = [
    "id",
    "wallId",
    "kind",
    "offsetFromWallStartPlanUnits",
    "widthPlanUnits",
    "openingHeightMeters",
    "sillHeightMeters",
  ];
  const kindKeys =
    candidate.kind === "door"
      ? [
          "operation",
          "variant",
          "finish",
          "leafCount",
          "hingeSide",
          "openingSide",
          "slideDirection",
        ]
      : candidate.kind === "window"
        ? ["operation", "variant", "panelCount", "glazing", "muntins", "hingeSide", "openingSide"]
        : candidate.kind === "passage"
          ? ["variant", "archRiseMeters"]
          : [];
  keys(candidate, [...base, ...kindKeys], path, issues);
  string(candidate.id, `${path}.id`, issues);
  string(candidate.wallId, `${path}.wallId`, issues);
  for (const key of [
    "offsetFromWallStartPlanUnits",
    "widthPlanUnits",
    "openingHeightMeters",
    "sillHeightMeters",
  ]) {
    finite(candidate[key], `${path}.${key}`, issues);
  }
  if (candidate.kind === "door" || candidate.kind === "window") {
    for (const [key, allowed] of Object.entries({
      hingeSide: ["start", "end"],
      openingSide: ["left", "right"],
      ...(candidate.kind === "door" ? { slideDirection: ["start", "end"] } : {}),
    })) {
      if (
        candidate[key] !== undefined &&
        !allowed.includes(typeof candidate[key] === "string" ? candidate[key] : "")
      ) {
        addProjectIssue(
          issues,
          "project.opening-orientation",
          `${path}.${key}`,
          `${key} must be ${allowed.join(" or ")}.`,
        );
      }
    }
  }
  if (candidate.kind === "door") {
    for (const error of doorDesignErrors(candidate))
      addProjectIssue(issues, `project.door-${error.code}`, `${path}.${error.key}`, error.message);
  } else if (candidate.kind === "window") {
    if (!["fixed", "casement"].includes(String(candidate.operation)))
      addProjectIssue(
        issues,
        "project.window-operation",
        `${path}.operation`,
        "Window operation is invalid.",
      );
    if (!["plain", "muntined"].includes(String(candidate.variant)))
      addProjectIssue(
        issues,
        "project.window-variant",
        `${path}.variant`,
        "Window variant is invalid.",
      );
    if (![1, 2].includes(candidate.panelCount as number))
      addProjectIssue(
        issues,
        "project.window-panel-count",
        `${path}.panelCount`,
        "Window panelCount is invalid.",
      );
    if (!["clear", "privacy"].includes(String(candidate.glazing)))
      addProjectIssue(
        issues,
        "project.window-glazing",
        `${path}.glazing`,
        "Window glazing is invalid.",
      );
    if (candidate.muntins !== undefined) {
      const muntins = record(candidate.muntins, `${path}.muntins`, issues);
      if (muntins) {
        keys(muntins, ["columns", "rows"], `${path}.muntins`, issues);
        finite(muntins.columns, `${path}.muntins.columns`, issues);
        finite(muntins.rows, `${path}.muntins.rows`, issues);
      }
    }
  } else if (candidate.kind === "passage") {
    if (!["rectangular", "arched"].includes(String(candidate.variant)))
      addProjectIssue(
        issues,
        "project.passage-variant",
        `${path}.variant`,
        "Passage variant is invalid.",
      );
    if (candidate.variant === "arched") {
      if (
        typeof candidate.archRiseMeters !== "number" ||
        !Number.isFinite(candidate.archRiseMeters)
      ) {
        addProjectIssue(
          issues,
          "project.passage-arch-rise",
          `${path}.archRiseMeters`,
          "Arched passages require a finite archRiseMeters value.",
        );
      }
    } else if (candidate.variant === "rectangular" && candidate.archRiseMeters !== undefined) {
      addProjectIssue(
        issues,
        "project.passage-arch-rise",
        `${path}.archRiseMeters`,
        "Rectangular passages must not declare archRiseMeters.",
      );
    }
  } else {
    addProjectIssue(issues, "project.opening-kind", `${path}.kind`, "Opening kind is invalid.");
  }
};

const floor = (value: unknown, path: string, issues: HomeProjectIssue[], legacy: boolean) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  keys(
    candidate,
    [
      "id",
      "name",
      "floorToFloorHeightMeters",
      "belowGround",
      "coordinates",
      "defaultWallHeightMeters",
      "defaultCeilingHeightMeters",
      "footprint",
      "footprintRegions",
      "rooms",
      "walls",
      "wallJunctions",
      "openings",
      "ceilings",
      "hedges",
      "pools",
      "outdoorPlatforms",
      "groundZones",
    ],
    path,
    issues,
  );
  if (candidate.groundZones !== undefined)
    array(candidate.groundZones, `${path}.groundZones`, issues)?.forEach((entry, index) =>
      floorZone(entry, `${path}.groundZones[${index}]`, issues),
    );
  if (candidate.hedges !== undefined)
    array(candidate.hedges, `${path}.hedges`, issues)?.forEach((entry, index) => {
      const hedgePath = `${path}.hedges[${index}]`;
      const hedge = record(entry, hedgePath, issues);
      if (!hedge) return;
      keys(hedge, ["id", "from", "to", "style", "heightMeters", "widthMeters"], hedgePath, issues);
      string(hedge.id, `${hedgePath}.id`, issues);
      point(hedge.from, `${hedgePath}.from`, issues);
      point(hedge.to, `${hedgePath}.to`, issues);
      if (
        !validHedge(
          hedge as unknown as HedgeSpec,
          (candidate.coordinates as { metersPerPlanUnit?: number } | undefined)
            ?.metersPerPlanUnit ?? 1,
        )
      )
        addProjectIssue(
          issues,
          "project.hedge",
          hedgePath,
          "Hedges need distinct endpoints, a supported style, height 0.2–5 m and width 0.2–3 m.",
        );
    });
  const edgeConfiguration = (value: unknown, edgePath: string) => {
    const c = record(value, edgePath, issues);
    if (!c) return;
    keys(c, ["kind", "heightMeters"], edgePath, issues);
    if (!["railing", "low-wall", "open"].includes(String(c.kind)))
      addProjectIssue(issues, "project.platform-edge", edgePath, "Unknown platform edge style.");
    if (c.kind !== "open") finite(c.heightMeters, `${edgePath}.heightMeters`, issues);
    else if (c.heightMeters !== undefined)
      addProjectIssue(
        issues,
        "project.platform-edge",
        edgePath,
        "Open edges do not have a barrier height.",
      );
  };
  if (candidate.outdoorPlatforms !== undefined)
    array(candidate.outdoorPlatforms, `${path}.outdoorPlatforms`, issues)?.forEach(
      (entry, index) => {
        const p = `${path}.outdoorPlatforms[${index}]`;
        const platform = record(entry, p, issues);
        if (!platform) return;
        keys(platform, ["id", "polygon", "finish", "defaultEdge", "edges"], p, issues);
        string(platform.id, `${p}.id`, issues);
        polygon(platform.polygon, `${p}.polygon`, issues);
        floorFinish(platform.finish, `${p}.finish`, issues);
        edgeConfiguration(platform.defaultEdge, `${p}.defaultEdge`);
        array(platform.edges, `${p}.edges`, issues)?.forEach((entry, i) => {
          const edgePath = `${p}.edges[${i}]`;
          const edge = record(entry, edgePath, issues);
          if (!edge) return;
          keys(edge, ["id", "configuration"], edgePath, issues);
          string(edge.id, `${edgePath}.id`, issues);
          if (edge.configuration !== undefined)
            edgeConfiguration(edge.configuration, `${edgePath}.configuration`);
        });
      },
    );
  if (candidate.pools !== undefined)
    array(candidate.pools, `${path}.pools`, issues)?.forEach((entry, index) => {
      const poolPath = `${path}.pools[${index}]`;
      const pool = record(entry, poolPath, issues);
      if (!pool) return;
      keys(pool, ["id", "polygon"], poolPath, issues);
      string(pool.id, `${poolPath}.id`, issues);
      polygon(pool.polygon, `${poolPath}.polygon`, issues);
    });
  string(candidate.id, `${path}.id`, issues);
  string(candidate.name, `${path}.name`, issues);
  const coordinates = record(candidate.coordinates, `${path}.coordinates`, issues);
  if (coordinates) {
    keys(coordinates, ["origin", "metersPerPlanUnit", "scaleBasis"], `${path}.coordinates`, issues);
    point(coordinates.origin, `${path}.coordinates.origin`, issues);
    finite(coordinates.metersPerPlanUnit, `${path}.coordinates.metersPerPlanUnit`, issues);
    if (!["measured", "inferred"].includes(String(coordinates.scaleBasis)))
      addProjectIssue(
        issues,
        "project.scale-basis",
        `${path}.coordinates.scaleBasis`,
        "Scale basis is invalid.",
      );
  }
  finite(candidate.defaultWallHeightMeters, `${path}.defaultWallHeightMeters`, issues);
  finite(candidate.defaultCeilingHeightMeters, `${path}.defaultCeilingHeightMeters`, issues);
  if (!legacy || candidate.floorToFloorHeightMeters !== undefined) {
    finite(candidate.floorToFloorHeightMeters, `${path}.floorToFloorHeightMeters`, issues);
    if (
      typeof candidate.floorToFloorHeightMeters === "number" &&
      candidate.floorToFloorHeightMeters <= 0
    )
      addProjectIssue(
        issues,
        "project.floor-height",
        `${path}.floorToFloorHeightMeters`,
        "Floor height must be positive.",
      );
  }
  if (legacy || !Array.isArray(candidate.footprint) || candidate.footprint.length !== 0)
    polygon(candidate.footprint, `${path}.footprint`, issues);
  if (candidate.footprintRegions !== undefined) {
    array(candidate.footprintRegions, `${path}.footprintRegions`, issues)?.forEach((entry, index) =>
      polygon(entry, `${path}.footprintRegions[${index}]`, issues),
    );
  }
  array(candidate.rooms, `${path}.rooms`, issues)?.forEach((entry, index) =>
    room(entry, `${path}.rooms[${index}]`, issues),
  );
  array(candidate.walls, `${path}.walls`, issues)?.forEach((entry, index) =>
    wall(entry, `${path}.walls[${index}]`, issues),
  );
  array(candidate.wallJunctions, `${path}.wallJunctions`, issues)?.forEach((entry, index) => {
    const junctionPath = `${path}.wallJunctions[${index}]`;
    const junction = record(entry, junctionPath, issues);
    if (!junction) return;
    keys(junction, ["id", "at", "wallIds"], junctionPath, issues);
    string(junction.id, `${junctionPath}.id`, issues);
    point(junction.at, `${junctionPath}.at`, issues);
    stringArray(junction.wallIds, `${junctionPath}.wallIds`, issues);
  });
  array(candidate.openings, `${path}.openings`, issues)?.forEach((entry, index) =>
    opening(entry, `${path}.openings[${index}]`, issues),
  );
  if (candidate.ceilings !== undefined)
    array(candidate.ceilings, `${path}.ceilings`, issues)?.forEach((entry, index) => {
      const ceilingPath = `${path}.ceilings[${index}]`;
      const ceiling = record(entry, ceilingPath, issues);
      if (!ceiling) return;
      keys(ceiling, ["id", "kind", "roomIds", "heightMeters"], ceilingPath, issues);
      string(ceiling.id, `${ceilingPath}.id`, issues);
      if (ceiling.kind !== "flat")
        addProjectIssue(
          issues,
          "project.ceiling-kind",
          `${ceilingPath}.kind`,
          "Layout projects support flat ceilings only.",
        );
      stringArray(ceiling.roomIds, `${ceilingPath}.roomIds`, issues);
      finite(ceiling.heightMeters, `${ceilingPath}.heightMeters`, issues);
    });
};

const placement = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  if (candidate.kind === "absolute") {
    keys(candidate, ["kind", "at", "elevationMeters", "rotationYRadians"], path, issues);
    point(candidate.at, `${path}.at`, issues);
    finite(candidate.elevationMeters, `${path}.elevationMeters`, issues);
    finite(candidate.rotationYRadians, `${path}.rotationYRadians`, issues);
  } else if (candidate.kind === "wall") {
    keys(
      candidate,
      [
        "kind",
        "wallId",
        "face",
        "offsetFromWallStartPlanUnits",
        "elevationMeters",
        "depthOffsetMeters",
        "rotationOffsetRadians",
      ],
      path,
      issues,
    );
    string(candidate.wallId, `${path}.wallId`, issues);
    if (!["left", "right"].includes(String(candidate.face)))
      addProjectIssue(
        issues,
        "project.wall-face",
        `${path}.face`,
        "Wall placement face is invalid.",
      );
    for (const key of [
      "offsetFromWallStartPlanUnits",
      "elevationMeters",
      "depthOffsetMeters",
      "rotationOffsetRadians",
    ])
      finite(candidate[key], `${path}.${key}`, issues);
  } else if (candidate.kind === "ceiling") {
    keys(candidate, ["kind", "roomId", "at", "dropMeters", "rotationYRadians"], path, issues);
    string(candidate.roomId, `${path}.roomId`, issues);
    point(candidate.at, `${path}.at`, issues);
    finite(candidate.dropMeters, `${path}.dropMeters`, issues);
    finite(candidate.rotationYRadians, `${path}.rotationYRadians`, issues);
  } else {
    keys(candidate, ["kind"], path, issues);
    addProjectIssue(
      issues,
      "project.placement-kind",
      `${path}.kind`,
      "Item placement kind is invalid.",
    );
  }
};

const sceneItem = (value: unknown, path: string, issues: HomeProjectIssue[], legacy: boolean) => {
  const candidate = record(value, path, issues);
  if (!candidate) return;
  const device = candidate.kind === "device";
  keys(
    candidate,
    device
      ? [
          "id",
          "floorId",
          "kind",
          "modelId",
          "variant",
          "placement",
          "size",
          "entitySlots",
          "lightState",
        ]
      : ["id", "floorId", "kind", "modelId", "variant", "placement", "size"],
    path,
    issues,
  );
  string(candidate.id, `${path}.id`, issues);
  string(candidate.modelId, `${path}.modelId`, issues);
  if (candidate.variant !== undefined) string(candidate.variant, `${path}.variant`, issues);
  if (!legacy) string(candidate.floorId, `${path}.floorId`, issues);
  if (!["furnishing", "device"].includes(String(candidate.kind)))
    addProjectIssue(issues, "project.item-kind", `${path}.kind`, "Scene item kind is invalid.");
  placement(candidate.placement, `${path}.placement`, issues);
  const size = array(candidate.size, `${path}.size`, issues);
  if (size && size.length !== 3)
    addProjectIssue(
      issues,
      "project.item-size-shape",
      `${path}.size`,
      "Item size requires exactly three dimensions.",
    );
  size?.forEach((entry, index) => finite(entry, `${path}.size[${index}]`, issues));
  if (
    device &&
    candidate.lightState !== undefined &&
    (typeof candidate.lightState !== "string" ||
      !["always-off", "always-on", "night-only", "connected"].includes(candidate.lightState))
  ) {
    addProjectIssue(
      issues,
      "project.light-state",
      `${path}.lightState`,
      "Choose always-off, always-on, night-only, or connected.",
    );
  }
  if (device)
    array(candidate.entitySlots, `${path}.entitySlots`, issues)?.forEach((entry, index) =>
      entitySlot(entry, `${path}.entitySlots[${index}]`, issues),
    );
};

export const validateHomeProjectSchemaShape = (
  input: unknown,
  issues: HomeProjectIssue[],
): HomeProject | LegacyHomeProject | null => {
  const project = record(input, "$", issues);
  if (!project) return null;
  const legacy = project.schemaVersion === 1;
  keys(
    project,
    [
      "schemaVersion",
      "seedRevision",
      "home",
      ...(legacy ? ["floor"] : ["floors", "coordinates", "stairs"]),
      "sceneItems",
      "roomProfiles",
      "openingProfiles",
      "shortcuts",
      "actionBar",
      "toolState",
      "assumptions",
    ],
    "$",
    issues,
  );
  if (!legacy && project.schemaVersion !== 2)
    addProjectIssue(
      issues,
      "project.schema-version",
      "schemaVersion",
      "Supported project versions are 1 and 2.",
    );
  if (project.toolState !== undefined) record(project.toolState, "toolState", issues);
  string(project.seedRevision, "seedRevision", issues);
  const home = record(project.home, "home", issues);
  if (home) {
    keys(home, ["id", "name", "locale", "palette", "roof", "walkStart"], "home", issues);
    if (home.walkStart !== undefined) {
      const start = record(home.walkStart, "home.walkStart", issues);
      if (start) {
        keys(start, ["floorId", "at"], "home.walkStart", issues);
        string(start.floorId, "home.walkStart.floorId", issues);
        point(start.at, "home.walkStart.at", issues);
      }
    }
    if (home.roof !== undefined) {
      const roof = record(home.roof, "home.roof", issues);
      if (roof) {
        keys(roof, ["direction", "color", "edgeColor"], "home.roof", issues);
        if (
          roof.direction !== "left-right" &&
          roof.direction !== "front-back" &&
          roof.direction !== "flat"
        )
          addProjectIssue(
            issues,
            "project.roof-direction",
            "home.roof.direction",
            "Choose a left–right or front–back roof ridge, or a flat roof.",
          );
        for (const field of ["color", "edgeColor"]) {
          if (typeof roof[field] !== "string" || !/^#[0-9a-f]{6}$/i.test(roof[field]))
            addProjectIssue(
              issues,
              "project.roof-color",
              `home.roof.${field}`,
              "Choose a six-digit hex roof color, such as #aa6250.",
            );
        }
      }
    }
    string(home.id, "home.id", issues);
    string(home.name, "home.name", issues);
    if (home.locale !== "en")
      addProjectIssue(issues, "project.locale", "home.locale", "V1 supports only the en locale.");
    const palette = record(home.palette, "home.palette", issues);
    if (palette) {
      keys(
        palette,
        ["accent", "secondary", "exterior", "interior", "ground"],
        "home.palette",
        issues,
      );
      for (const color of ["accent", "secondary", "exterior", "interior", "ground"])
        string(palette[color], `home.palette.${color}`, issues);
    }
  }
  if (legacy) floor(project.floor, "floor", issues, true);
  else {
    const coordinates = record(project.coordinates, "coordinates", issues);
    if (coordinates) {
      keys(coordinates, ["origin", "metersPerPlanUnit", "scaleBasis"], "coordinates", issues);
      point(coordinates.origin, "coordinates.origin", issues);
      finite(coordinates.metersPerPlanUnit, "coordinates.metersPerPlanUnit", issues);
      if (typeof coordinates.metersPerPlanUnit === "number" && coordinates.metersPerPlanUnit <= 0)
        addProjectIssue(
          issues,
          "project.scale",
          "coordinates.metersPerPlanUnit",
          "Scale must be positive.",
        );
      if (!["measured", "inferred"].includes(String(coordinates.scaleBasis)))
        addProjectIssue(
          issues,
          "project.scale-basis",
          "coordinates.scaleBasis",
          "Scale basis is invalid.",
        );
    }
    const floors = array(project.floors, "floors", issues);
    if (floors?.length === 0)
      addProjectIssue(
        issues,
        "project.floors-empty",
        "floors",
        "A building requires a ground floor.",
      );
    const floorIds = new Set<string>();
    let groundSeen = false;
    floors?.forEach((entry, index) => {
      const path = `floors[${index}]`;
      floor(entry, path, issues, false);
      if (!isPlainRecord(entry)) return;
      if (entry.belowGround !== undefined && typeof entry.belowGround !== "boolean")
        addProjectIssue(
          issues,
          "project.floor-basement",
          `${path}.belowGround`,
          "Basement classification must be a boolean.",
        );
      if (entry.belowGround === true && groundSeen)
        addProjectIssue(
          issues,
          "project.floor-order",
          `${path}.belowGround`,
          "Basements must precede the ground floor.",
        );
      if (entry.belowGround !== true) groundSeen = true;
      if (typeof entry.id === "string") {
        if (floorIds.has(entry.id))
          addProjectIssue(
            issues,
            "project.floor-id-duplicate",
            `${path}.id`,
            "Floor IDs must be unique.",
          );
        floorIds.add(entry.id);
      }
      const transform = entry.coordinates;
      if (
        coordinates &&
        isPlainRecord(transform) &&
        (JSON.stringify(transform.origin) !== JSON.stringify(coordinates.origin) ||
          transform.metersPerPlanUnit !== coordinates.metersPerPlanUnit ||
          transform.scaleBasis !== coordinates.scaleBasis)
      )
        addProjectIssue(
          issues,
          "project.floor-transform",
          `${path}.coordinates`,
          "All floors must use the building coordinates.",
        );
    });
    if (floors?.length && !groundSeen)
      addProjectIssue(
        issues,
        "project.ground-missing",
        "floors",
        "A building requires a ground floor.",
      );
    array(project.stairs, "stairs", issues)?.forEach((entry, index) => {
      const path = `stairs[${index}]`;
      const stair = record(entry, path, issues);
      if (!stair) return;
      const shape = stair.shape ?? "straight";
      if (
        stair.railings !== undefined &&
        !["both", "left", "right", "none"].includes(
          typeof stair.railings === "string" ? stair.railings : "",
        )
      )
        addProjectIssue(
          issues,
          "stair.railings",
          `${path}.railings`,
          "Choose Both, Left, Right, or None.",
        );
      const dimensions =
        shape === "spiral"
          ? ["diameterMeters", "totalTurnDegrees"]
          : shape === "l-shaped" || shape === "u-shaped"
            ? ["widthMeters", "lowerRunMeters", "upperRunMeters"]
            : ["widthMeters", "runMeters"];
      keys(
        stair,
        [
          "id",
          "lowerFloorId",
          "upperFloorId",
          "at",
          "rotationYRadians",
          "shape",
          "railings",
          ...dimensions,
          ...(shape === "spiral"
            ? ["direction"]
            : shape === "l-shaped" || shape === "u-shaped"
              ? ["turn"]
              : []),
        ],
        path,
        issues,
      );
      if (
        !["straight", "l-shaped", "u-shaped", "spiral"].includes(
          typeof shape === "string" ? shape : "",
        )
      )
        addProjectIssue(issues, "stair.shape", `${path}.shape`, "Unknown stair shape.");
      if (
        shape === "spiral" &&
        !["clockwise", "counterclockwise"].includes(String(stair.direction))
      )
        addProjectIssue(
          issues,
          "stair.direction",
          `${path}.direction`,
          "Choose clockwise or counterclockwise.",
        );
      if (
        (shape === "l-shaped" || shape === "u-shaped") &&
        !["left", "right"].includes(String(stair.turn))
      )
        addProjectIssue(issues, "stair.turn", `${path}.turn`, "Choose left or right.");
      for (const key of ["id", "lowerFloorId", "upperFloorId"])
        string(stair[key], `${path}.${key}`, issues);
      point(stair.at, `${path}.at`, issues);
      for (const key of ["rotationYRadians", ...dimensions])
        finite(stair[key], `${path}.${key}`, issues);
    });
  }
  array(project.sceneItems, "sceneItems", issues)?.forEach((entry, index) =>
    sceneItem(entry, `sceneItems[${index}]`, issues, legacy),
  );
  const roomProfiles = record(project.roomProfiles, "roomProfiles", issues);
  if (roomProfiles)
    for (const [id, entry] of Object.entries(roomProfiles)) {
      const path = `roomProfiles.${id}`;
      const profile = record(entry, path, issues);
      if (!profile) continue;
      keys(profile, ["dashboardSlots"], path, issues);
      array(profile.dashboardSlots, `${path}.dashboardSlots`, issues)?.forEach((slot, index) =>
        entitySlot(slot, `${path}.dashboardSlots[${index}]`, issues),
      );
    }
  const openingProfiles = record(project.openingProfiles, "openingProfiles", issues);
  if (openingProfiles)
    for (const [id, entry] of Object.entries(openingProfiles)) {
      const path = `openingProfiles.${id}`;
      const profile = record(entry, path, issues);
      if (!profile) continue;
      keys(profile, ["contactSlot", "coverSlot"], path, issues);
      if (profile.coverSlot !== undefined) {
        const slot = record(profile.coverSlot, `${path}.coverSlot`, issues);
        if (slot) {
          keys(slot, ["id", "autoMap"], `${path}.coverSlot`, issues);
          if (typeof slot.id !== "string" || !slot.id.trim())
            addProjectIssue(
              issues,
              "project.cover-slot-id",
              `${path}.coverSlot.id`,
              "Cover slot needs an ID.",
            );
          if (!["manual", "unique-compatible"].includes(String(slot.autoMap)))
            addProjectIssue(
              issues,
              "project.cover-slot-auto-map",
              `${path}.coverSlot.autoMap`,
              "Invalid cover mapping policy.",
            );
        }
      }
      if (profile.contactSlot !== undefined)
        contactSlot(profile.contactSlot, `${path}.contactSlot`, issues);
    }
  array(project.shortcuts, "shortcuts", issues)?.forEach((entry, index) => {
    const path = `shortcuts[${index}]`;
    const shortcut = record(entry, path, issues);
    if (!shortcut) return;
    keys(shortcut, ["id", "action", "context", "order"], path, issues);
    string(shortcut.id, `${path}.id`, issues);
    if (
      ![
        "home-view",
        "room-details",
        "construct-mode",
        "arrange-mode",
        "connect-mode",
        "walk-mode",
        "lighting-mode",
        "wall-fade",
        "all-lights",
      ].includes(String(shortcut.action))
    )
      addProjectIssue(
        issues,
        "project.shortcut-action",
        `${path}.action`,
        "Shortcut action is invalid.",
      );
    if (!["overview", "room", "both"].includes(String(shortcut.context)))
      addProjectIssue(
        issues,
        "project.shortcut-context",
        `${path}.context`,
        "Shortcut context is invalid.",
      );
    if (!Number.isInteger(shortcut.order))
      addProjectIssue(
        issues,
        "project.shortcut-order",
        `${path}.order`,
        "Shortcut order must be an integer.",
      );
  });
  if (project.actionBar !== undefined) {
    const actionBar = record(project.actionBar, "actionBar", issues);
    if (actionBar) {
      keys(actionBar, ["items"], "actionBar", issues);
      array(actionBar.items, "actionBar.items", issues)?.forEach((entry, index) => {
        const path = `actionBar.items[${index}]`;
        const item = record(entry, path, issues);
        if (!item) return;
        keys(item, ["id", "target"], path, issues);
        string(item.id, `${path}.id`, issues);
        const target = record(item.target, `${path}.target`, issues);
        if (!target) return;
        const targetPath = `${path}.target`;
        if (target.kind === "built-in") {
          keys(target, ["kind", "action"], targetPath, issues);
          if (!["build", "walk", "night", "view", "all-lights"].includes(String(target.action))) {
            addProjectIssue(
              issues,
              "project.action-bar-built-in",
              `${targetPath}.action`,
              "Action bar built-in action is invalid.",
            );
          }
        } else if (target.kind === "scene" || target.kind === "script") {
          keys(target, ["kind"], targetPath, issues);
        } else if (target.kind === "walk-tool") {
          keys(target, ["kind", "toolId"], targetPath, issues);
          string(target.toolId, `${targetPath}.toolId`, issues);
        } else if (target.kind === "room") {
          keys(target, ["kind", "roomId"], targetPath, issues);
          string(target.roomId, `${targetPath}.roomId`, issues);
        } else if (target.kind === "device") {
          keys(target, ["kind", "deviceId"], targetPath, issues);
          string(target.deviceId, `${targetPath}.deviceId`, issues);
        } else {
          keys(target, ["kind"], targetPath, issues);
          addProjectIssue(
            issues,
            "project.action-bar-target-kind",
            `${targetPath}.kind`,
            "Action bar target kind is invalid.",
          );
        }
      });
    }
  }
  array(project.assumptions, "assumptions", issues)?.forEach((entry, index) => {
    const path = `assumptions[${index}]`;
    const assumption = record(entry, path, issues);
    if (!assumption) return;
    keys(assumption, ["id", "subjectId", "summary", "basis"], path, issues);
    string(assumption.id, `${path}.id`, issues);
    string(assumption.subjectId, `${path}.subjectId`, issues);
    string(assumption.summary, `${path}.summary`, issues);
    if (!["measured", "plan", "photo", "inferred", "user"].includes(String(assumption.basis)))
      addProjectIssue(
        issues,
        "project.assumption-basis",
        `${path}.basis`,
        "Assumption basis is invalid.",
      );
  });
  return project as unknown as HomeProject | LegacyHomeProject;
};

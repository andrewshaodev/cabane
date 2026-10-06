import { paintCeramicTile } from "./ceramic-tile";
import { paintBlueQuatrefoilTile } from "./blue-quatrefoil-tile";
import { paintBlackWhitePatchwork } from "./black-white-patchwork";
import { paintDirt } from "./dirt";
import { paintPineBark } from "./pine-bark";
import { paintTomettes } from "./tomettes";
import { paintStones } from "./stones";
import {
  FLOOR_PATTERN_PRESET_IDS,
  type FloorFinishSpec,
  type FloorPatternPresetId,
  type RoomSpec,
} from "../types";

export type FloorPatternVariant = "plan" | "scene";

export interface FloorFinishPreset {
  id: FloorPatternPresetId;
  label: string;
  representativeColor: string;
  repeatMeters: number;
  configurableColor?: boolean;
}

export const FLOOR_FINISH_PRESETS: readonly FloorFinishPreset[] = [
  { id: "light-oak", label: "Light oak", representativeColor: "#c99e66", repeatMeters: 1.2 },
  {
    id: "light-oak-horizontal",
    label: "Light oak 2",
    representativeColor: "#c99e66",
    repeatMeters: 1.2,
  },
  {
    id: "oak-herringbone",
    label: "Oak herringbone",
    representativeColor: "#c29a67",
    repeatMeters: 0.8,
  },
  { id: "travertine", label: "Travertine", representativeColor: "#d9c7aa", repeatMeters: 1.2 },
  { id: "terracotta-tile", label: "Terracotta", representativeColor: "#bd7756", repeatMeters: 0.8 },
  { id: "terrazzo", label: "Terrazzo", representativeColor: "#cabfa9", repeatMeters: 0.7 },
  { id: "dark-walnut", label: "Dark walnut", representativeColor: "#765139", repeatMeters: 1.2 },
  { id: "limestone", label: "Limestone", representativeColor: "#cbc3ad", repeatMeters: 1.2 },
  {
    id: "square-tile",
    label: "Square tile",
    representativeColor: "#dedbd2",
    repeatMeters: 1.2,
    configurableColor: true,
  },
  {
    id: "subway-tile",
    label: "Rectangular tile",
    representativeColor: "#c5d4cd",
    repeatMeters: 1.2,
    configurableColor: true,
  },
  {
    id: "checkerboard-tile",
    label: "Checkerboard tile",
    representativeColor: "#545e68",
    repeatMeters: 1.2,
    configurableColor: true,
  },
  {
    id: "encaustic-tile",
    label: "Encaustic tile",
    representativeColor: "#c7ad86",
    repeatMeters: 0.6,
  },
  {
    id: "black-white-patchwork",
    label: "Black & white patchwork",
    representativeColor: "#b4b3aa",
    repeatMeters: 0.8,
  },
  {
    id: "blue-quatrefoil-tile",
    label: "Blue quatrefoil tile",
    representativeColor: "#b7c1bd",
    repeatMeters: 0.4,
  },
  { id: "sand", label: "Sand", representativeColor: "#d7c28f", repeatMeters: 1.4 },
  { id: "gravel", label: "Gravel", representativeColor: "#aaa38f", repeatMeters: 0.72 },
  { id: "light-dirt", label: "Light dirt", representativeColor: "#ab8962", repeatMeters: 1.2 },
  { id: "dark-dirt", label: "Dark dirt", representativeColor: "#65503d", repeatMeters: 1.2 },
  { id: "pine-bark", label: "Pine bark", representativeColor: "#79503a", repeatMeters: 0.8 },
  {
    id: "tomettes",
    label: "Hexagonal terracotta",
    representativeColor: "#b66b4b",
    repeatMeters: 0.9,
  },
  {
    id: "stepping-stones",
    label: "Stepping stones",
    representativeColor: "#91a06a",
    repeatMeters: 1.8,
  },
  { id: "pebbles", label: "River pebbles", representativeColor: "#aaa698", repeatMeters: 0.6 },
];

const presetById = new Map(FLOOR_FINISH_PRESETS.map((preset) => [preset.id, preset]));

export const floorFinishPreset = (id: FloorPatternPresetId) => presetById.get(id)!;

const line = (
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) => {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
};

const planks = (
  context: CanvasRenderingContext2D,
  colors: readonly [string, string, string],
  seams: string,
  orientation: "vertical" | "horizontal" = "vertical",
) => {
  const size = context.canvas.width;
  const width = size / 6;
  context.fillStyle = colors[0];
  context.fillRect(0, 0, size, size);
  for (let plank = 0; plank < 6; plank += 1) {
    context.fillStyle = colors[plank % colors.length];
    const joint = plank % 2 === 0 ? size * 0.42 : size * 0.68;
    if (orientation === "horizontal") {
      context.fillRect(0, plank * width, size, width);
      line(context, seams, 1, 0, plank * width, size, plank * width);
      line(context, seams, 1, joint, plank * width, joint, (plank + 1) * width);
    } else {
      context.fillRect(plank * width, 0, width, size);
      line(context, seams, 1, plank * width, 0, plank * width, size);
      line(context, seams, 1, plank * width, joint, (plank + 1) * width, joint);
    }
  }
};

const travertine = (context: CanvasRenderingContext2D, quiet: boolean) => {
  const size = context.canvas.width;
  context.fillStyle = quiet ? "#ded3c0" : "#dcc9ac";
  context.fillRect(0, 0, size, size);

  // Short, scattered mineral pores avoid continuous bands across repeats.
  let seed = 72341;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  for (let index = 0; index < 85; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = size * (0.004 + random() * 0.012);
    context.fillStyle = index % 3 === 0 ? "rgba(245, 231, 208, 0.22)" : "rgba(156, 128, 94, 0.12)";
    context.beginPath();
    context.ellipse(x, y, radius * 1.8, radius * 0.5, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = quiet ? "rgba(171, 151, 124, 0.2)" : "rgba(156, 128, 94, 0.24)";
  for (const [x, y, width] of [
    [0.12, 0.38, 0.08],
    [0.37, 0.12, 0.05],
    [0.57, 0.43, 0.1],
    [0.76, 0.27, 0.06],
    [0.2, 0.74, 0.1],
    [0.62, 0.92, 0.07],
    [0.86, 0.58, 0.05],
  ])
    context.fillRect(x * size, y * size, width * size, quiet ? 1 : 2);

  const joint = quiet ? "rgba(143, 128, 108, 0.15)" : "rgba(132, 112, 86, 0.18)";
  line(context, joint, 1, 0, size / 3, size, size / 3);
  line(context, joint, 1, 0, (size * 2) / 3, size, (size * 2) / 3);
  for (let row = 0; row < 3; row += 1) {
    const x = row % 2 === 0 ? size / 2 : size / 4;
    line(context, joint, 1, x, (row * size) / 3, x, ((row + 1) * size) / 3);
  }
};

const tiles = (
  context: CanvasRenderingContext2D,
  base: string,
  grout: string,
  columns: number,
  rows: number,
  stagger: boolean,
) => {
  const size = context.canvas.width;
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  const width = size / columns;
  const height = size / rows;
  for (let row = 0; row <= rows; row += 1) {
    line(context, grout, 2, 0, row * height, size, row * height);
  }
  for (let row = 0; row < rows; row += 1) {
    const offset = stagger && row % 2 ? width / 2 : 0;
    for (let column = -1; column <= columns; column += 1) {
      const x = column * width + offset;
      line(context, grout, 2, x, row * height, x, (row + 1) * height);
    }
  }
};

const herringbone = (context: CanvasRenderingContext2D, base: string, seam: string) => {
  const size = context.canvas.width;
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  for (let offset = -size; offset < size * 2; offset += 24) {
    line(context, seam, 2, offset, 0, offset + size, size);
    line(context, seam, 2, offset + 12, size, offset + size + 12, 0);
  }
};

const terrazzo = (
  context: CanvasRenderingContext2D,
  base: string,
  colors: readonly string[],
  count: number,
) => {
  const size = context.canvas.width;
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  let seed = 14731;
  for (let index = 0; index < count; index += 1) {
    seed = (seed * 48271) % 2147483647;
    const x = seed % size;
    seed = (seed * 48271) % 2147483647;
    const y = seed % size;
    const radius = 1 + (seed % 4);
    context.fillStyle = colors[index % colors.length];
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
};

const granular = (
  context: CanvasRenderingContext2D,
  base: string,
  colors: readonly string[],
  count: number,
  maximumRadius: number,
) => {
  const size = context.canvas.width;
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  let seed = 39119;
  for (let index = 0; index < count; index += 1) {
    seed = (seed * 48271) % 2147483647;
    const x = seed % size;
    seed = (seed * 48271) % 2147483647;
    const y = seed % size;
    seed = (seed * 48271) % 2147483647;
    const radius = 0.5 + (seed % maximumRadius);
    context.fillStyle = colors[index % colors.length];
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
};

const encaustic = (context: CanvasRenderingContext2D, quiet: boolean) => {
  const size = context.canvas.width;
  tiles(context, quiet ? "#cfbea2" : "#c7ad86", quiet ? "#eee5d7" : "#efe5cf", 4, 4, false);
  const cell = size / 4;
  context.fillStyle = quiet ? "#73847f" : "#526b66";
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      context.beginPath();
      context.arc(column * cell + cell / 2, row * cell + cell / 2, cell * 0.2, 0, Math.PI * 2);
      context.fill();
    }
  }
};

export const paintFloorPattern = (
  context: CanvasRenderingContext2D,
  id: FloorPatternPresetId,
  variant: FloorPatternVariant,
  color?: string,
) => {
  const quiet = variant === "plan";
  switch (id) {
    case "square-tile":
    case "subway-tile":
    case "checkerboard-tile":
      paintCeramicTile(context, id, color ?? floorFinishPreset(id).representativeColor);
      break;
    case "light-dirt":
    case "dark-dirt":
      paintDirt(context, id === "dark-dirt", quiet);
      break;
    case "pine-bark":
      paintPineBark(context, quiet);
      break;
    case "tomettes":
      paintTomettes(context, quiet);
      break;
    case "stepping-stones":
    case "pebbles":
      paintStones(context, id === "stepping-stones", quiet);
      break;
    case "light-oak":
      planks(
        context,
        quiet ? ["#d1b184", "#d5b98f", "#cbaa7d"] : ["#c99e66", "#d5ad77", "#b98952"],
        quiet ? "#ad9473" : "#765437",
      );
      break;
    case "light-oak-horizontal":
      planks(
        context,
        quiet ? ["#d1b184", "#d5b98f", "#cbaa7d"] : ["#c99e66", "#d5ad77", "#b98952"],
        quiet ? "#ad9473" : "#765437",
        "horizontal",
      );
      break;
    case "dark-walnut":
      planks(
        context,
        quiet ? ["#80634f", "#876b55", "#755845"] : ["#765139", "#8a6247", "#5f402f"],
        quiet ? "#6d5849" : "#4d3428",
      );
      break;
    case "oak-herringbone":
      herringbone(context, quiet ? "#cfb084" : "#c7a06d", quiet ? "#ad8d67" : "#8e6843");
      break;
    case "travertine":
      travertine(context, quiet);
      break;
    case "terracotta-tile":
      tiles(context, quiet ? "#c88b70" : "#bd7756", quiet ? "#a87561" : "#93583f", 5, 5, false);
      break;
    case "terrazzo":
      terrazzo(
        context,
        quiet ? "#d7cfbf" : "#d5cbb7",
        quiet ? ["#93978f", "#b58876", "#eee6d9"] : ["#7a8176", "#aa7158", "#efe5d0", "#7d6654"],
        quiet ? 24 : 44,
      );
      break;
    case "limestone":
      tiles(context, quiet ? "#d1cbbb" : "#cbc3ad", quiet ? "#b8b2a2" : "#a9a18c", 4, 5, true);
      break;
    case "blue-quatrefoil-tile":
      paintBlueQuatrefoilTile(context, quiet);
      break;
    case "black-white-patchwork":
      paintBlackWhitePatchwork(context, quiet);
      break;
    case "encaustic-tile":
      encaustic(context, quiet);
      break;
    case "sand":
      granular(
        context,
        quiet ? "#ddd0aa" : "#d7c28f",
        quiet ? ["#c9ba91", "#e6dab9", "#d2c39b"] : ["#c6ad73", "#ead9ad", "#bfa66d"],
        quiet ? 38 : 62,
        2,
      );
      line(
        context,
        quiet ? "#c9bb96" : "#c3a970",
        1,
        0,
        context.canvas.height * 0.27,
        context.canvas.width,
        context.canvas.height * 0.3,
      );
      line(
        context,
        quiet ? "#e5dab9" : "#ead8aa",
        1,
        0,
        context.canvas.height * 0.69,
        context.canvas.width,
        context.canvas.height * 0.65,
      );
      break;
    case "gravel":
      granular(
        context,
        quiet ? "#b8b2a2" : "#aaa38f",
        quiet ? ["#989487", "#c9c2af", "#aaa392"] : ["#827e72", "#c3bba6", "#96907f", "#d0c6ad"],
        quiet ? 54 : 92,
        4,
      );
      break;
  }
};

export const DEFAULT_ROOM_FLOOR_FINISH: FloorFinishSpec = {
  kind: "solid",
  color: "#d3cec5",
};

export const resolveRoomFloorFinish = (room: Pick<RoomSpec, "floorFinish">): FloorFinishSpec =>
  room.floorFinish ?? DEFAULT_ROOM_FLOOR_FINISH;

export const floorFinishRepresentativeColor = (finish: FloorFinishSpec) =>
  finish.kind === "solid"
    ? finish.color
    : (finish.color ?? floorFinishPreset(finish.preset).representativeColor);

if (FLOOR_FINISH_PRESETS.length !== FLOOR_PATTERN_PRESET_IDS.length) {
  throw new Error("Floor finish preset registry is incomplete.");
}

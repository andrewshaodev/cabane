import type { HedgeStyle } from "../types";

export const HEDGE_STYLES = [
  {
    id: "clipped",
    label: "Clipped box",
    description: "Straight, neatly trimmed",
    heightMeters: 1.4,
    widthMeters: 0.65,
  },
  {
    id: "rounded",
    label: "Rounded",
    description: "Soft, clipped curves",
    heightMeters: 1.4,
    widthMeters: 0.65,
  },
  {
    id: "bushy",
    label: "Bushy",
    description: "Loose natural growth",
    heightMeters: 1.4,
    widthMeters: 0.8,
  },
  {
    id: "mixed",
    label: "Tall mixed hedge",
    description: "Oleander & evergreen laurel",
    heightMeters: 2.6,
    widthMeters: 1.2,
  },
  {
    id: "ivy-wall",
    label: "Ivy-covered wall",
    description: "Dense, trailing ivy",
    heightMeters: 2.2,
    widthMeters: 0.75,
  },
  {
    id: "picket",
    label: "Picket fence",
    description: "Painted pointed timber",
    heightMeters: 1.1,
    widthMeters: 0.2,
  },
  {
    id: "privacy",
    label: "Privacy fence",
    description: "Solid horizontal timber panels",
    heightMeters: 1.8,
    widthMeters: 0.2,
  },
  {
    id: "post-rail",
    label: "Post and rail",
    description: "Open timber pasture rails",
    heightMeters: 1.2,
    widthMeters: 0.2,
  },
  {
    id: "metal-bars",
    label: "Metal fence",
    description: "Slender vertical steel bars",
    heightMeters: 1.5,
    widthMeters: 0.2,
  },
  {
    id: "masonry",
    label: "Low masonry wall",
    description: "Stone blocks with coping",
    heightMeters: 0.9,
    widthMeters: 0.3,
  },
] as const satisfies readonly {
  id: HedgeStyle;
  label: string;
  description: string;
  heightMeters: number;
  widthMeters: number;
}[];

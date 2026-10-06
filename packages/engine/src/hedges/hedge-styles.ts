import type { HedgeStyle } from "../types";

export const HEDGE_STYLES = [
  { id: "clipped", label: "Clipped box", description: "Straight, neatly trimmed", heightMeters: 1.4, widthMeters: .65 },
  { id: "rounded", label: "Rounded", description: "Soft, clipped curves", heightMeters: 1.4, widthMeters: .65 },
  { id: "bushy", label: "Bushy", description: "Loose natural growth", heightMeters: 1.4, widthMeters: .8 },
  { id: "mixed", label: "Tall mixed hedge", description: "Oleander & evergreen laurel", heightMeters: 2.6, widthMeters: 1.2 },
  { id: "ivy-wall", label: "Ivy-covered wall", description: "Dense, trailing ivy", heightMeters: 2.2, widthMeters: .75 },
] as const satisfies readonly { id: HedgeStyle; label: string; description: string; heightMeters: number; widthMeters: number }[];

type ColorfulRugVariant =
  | "terracotta"
  | "sage"
  | "sage-woven"
  | "ocean"
  | "playful"
  | "jute"
  | "sisal"
  | "persian"
  | "kilim"
  | "moroccan"
  | "shag"
  | "braided"
  | "striped"
  | "checkered"
  | "scandinavian";
type RugBlock = readonly [
  x: number,
  z: number,
  width: number,
  depth: number,
  color: string,
  angle?: number,
];

export const COLORFUL_RUG_VARIANTS: Readonly<
  Record<
    ColorfulRugVariant,
    {
      field: string;
      outline: string;
      border: string;
      blocks: readonly RugBlock[];
    }
  >
> = {
  terracotta: {
    field: "#dfcdb6",
    outline: "#8d5d49",
    border: "#a85f45",
    blocks: [
      [-0.54, -0.66, 0.34, 0.84, "#c97858"],
      [0, 0, 0.46, 0.62, "#9d5945"],
      [0.54, 0.66, 0.34, 0.84, "#c97858"],
      [-0.5, 0.78, 0.26, 0.3, "#eddcc6"],
      [0.5, -0.78, 0.26, 0.3, "#eddcc6"],
    ],
  },
  "sage-woven": { field: "#8e9b79", outline: "#667455", border: "#a6ae8d", blocks: [] },
  sage: {
    field: "#d7d5bd",
    outline: "#5f6c59",
    border: "#78866b",
    blocks: [
      [-0.56, -0.72, 0.42, 0.68, "#9baa8a"],
      [0.28, -0.78, 0.66, 0.3, "#b8bea1"],
      [-0.22, 0.04, 0.7, 0.38, "#879677"],
      [0.52, 0.52, 0.36, 0.86, "#a8b397"],
      [-0.58, 0.82, 0.3, 0.4, "#eee5cf"],
    ],
  },
  ocean: {
    field: "#d5dedc",
    outline: "#476774",
    border: "#587d88",
    blocks: [
      [-0.42, -1, 0.72, 0.24, "#7ea3aa"],
      [0.4, -0.58, 0.74, 0.24, "#9bb8ba"],
      [-0.4, -0.12, 0.74, 0.24, "#668c97"],
      [0.4, 0.34, 0.74, 0.24, "#86a9ae"],
      [-0.4, 0.8, 0.74, 0.24, "#527985"],
    ],
  },
  playful: {
    field: "#eadfc9",
    outline: "#705f56",
    border: "#94715f",
    blocks: [
      [-0.55, -0.86, 0.4, 0.48, "#cf7758"],
      [0.02, -0.9, 0.42, 0.32, "#dbad62"],
      [0.58, -0.62, 0.3, 0.7, "#6f9493"],
      [-0.42, -0.08, 0.62, 0.3, "#8fa27e"],
      [0.32, 0.08, 0.46, 0.48, "#c58a76"],
      [-0.58, 0.62, 0.28, 0.7, "#75939e"],
      [0.18, 0.72, 0.72, 0.32, "#d4a554"],
    ],
  },
  jute: {
    field: "#bd965d",
    outline: "#85643d",
    border: "#a9824c",
    blocks: Array.from({ length: 23 }, (_, i) => [
      0,
      -1.32 + i * 0.12,
      1.78,
      0.045,
      i % 2 ? "#cba66f" : "#d5b783",
    ]),
  },
  sisal: {
    field: "#c9b891",
    outline: "#827253",
    border: "#665c49",
    blocks: Array.from({ length: 17 }, (_, i) => [-0.8 + i * 0.1, 0, 0.035, 2.72, "#b5a37c"]),
  },
  persian: {
    field: "#843f3c",
    outline: "#493744",
    border: "#d5ad76",
    blocks: [
      [0, 0, 0.72, 0.72, "#d9b981", Math.PI / 4],
      ...[-0.62, 0.62].flatMap((x) =>
        [-1.1, -0.55, 0, 0.55, 1.1].map((z): RugBlock => [
          x,
          z,
          0.13,
          0.13,
          "#344c61",
          Math.PI / 4,
        ]),
      ),
    ],
  },
  kilim: {
    field: "#c49165",
    outline: "#80543c",
    border: "#8d493b",
    blocks: [-0.9, 0, 0.9].flatMap((z) =>
      [-0.44, 0.44].map((x): RugBlock => [
        x,
        z,
        0.46,
        0.46,
        z === 0 ? "#516f70" : "#e0ba7b",
        Math.PI / 4,
      ]),
    ),
  },
  moroccan: {
    field: "#eee3cc",
    outline: "#b2a48a",
    border: "#e0d2b6",
    blocks: [-0.87, 0, 0.87].flatMap((z) =>
      [-1, 1].flatMap((side) =>
        [-1, 1].map((slope): RugBlock => [
          side * 0.2,
          z + slope * 0.2,
          0.025,
          0.53,
          "#5c5249",
          (-side * slope * Math.PI) / 4,
        ]),
      ),
    ),
  },
  shag: {
    field: "#e6d8c7",
    outline: "#bcaa95",
    border: "#dccab4",
    blocks: Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 7 }, (_, col): RugBlock => [
        -0.75 + col * 0.25,
        -1.2 + row * 0.3,
        0.13,
        0.2,
        (row + col) % 2 ? "#efe4d4" : "#d4c2ac",
      ]),
    ).flat(),
  },
  braided: {
    field: "#b6a080",
    outline: "#75634f",
    border: "#91765c",
    blocks: Array.from({ length: 13 }, (_, row) =>
      [-1, 1].map((side): RugBlock => [
        side * 0.34,
        -1.2 + row * 0.2,
        0.63,
        0.065,
        row % 2 ? "#d0b793" : "#887b61",
        side * 0.2,
      ]),
    ).flat(),
  },
  striped: {
    field: "#eee5d3",
    outline: "#8b9a9c",
    border: "#d3c9b4",
    blocks: Array.from({ length: 7 }, (_, i) => [0, -1.2 + i * 0.4, 1.78, 0.18, "#486877"]),
  },
  checkered: {
    field: "#ede1ce",
    outline: "#8f775e",
    border: "#bfaa8c",
    blocks: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 4 }, (_, col): RugBlock => [
        -0.63 + col * 0.42,
        -1.155 + row * 0.33,
        0.42,
        0.33,
        "#9e795b",
      ]).filter((_, col) => (row + col) % 2 === 0),
    ).flat(),
  },
  scandinavian: {
    field: "#dcded8",
    outline: "#949b96",
    border: "#c4cbc5",
    blocks: [
      [-0.48, -0.8, 0.5, 0.75, "#889b9a"],
      [0.35, 0, 0.68, 0.48, "#b1a38f"],
      [-0.4, 0.8, 0.45, 0.6, "#727f83"],
    ],
  },
};

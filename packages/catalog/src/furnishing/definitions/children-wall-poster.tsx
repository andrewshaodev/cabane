import { defineFurnishingModel } from "@cabane/engine";
import { ChildrenWallPoster } from "../presets/children-bedroom/children-wall-poster";
export const childrenWallPosterDefinition = defineFurnishingModel({
  component: ChildrenWallPoster,
  label: "Children wall poster",
  category: "Decor",
  defaultRoomType: "bedroom",
  defaultSize: [0.3, 0.42, 0.012],
  bounds: { min: [-0.15, 0, 0], max: [0.15, 0.42, 0.012] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: false,
  variants: [
    { id: "default", label: "Sport · red" },
    { id: "blue", label: "Sport · blue" },
    { id: "rainbow", label: "Pastel rainbow" },
  ],
  complexity: { visibleMeshes: 6, triangles: 2100 },
});

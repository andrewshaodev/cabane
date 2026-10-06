import { defineFurnishingModel } from "@cabane/engine";
import { SquareCubeStorage } from "../presets/children-bedroom/square-cube-storage";
export const squareCubeStorageDefinition = defineFurnishingModel({
  component: SquareCubeStorage,
  label: "Square cube storage",
  variants: [
    { id: "default", label: "Four compartments" },
    { id: "two-compartment", label: "Two compartments" },
  ],
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [0.77, 0.77, 0.39],
  bounds: { min: [-0.385, 0, -0.195], max: [0.385, 0.77, 0.195] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 10, triangles: 4200 },
});

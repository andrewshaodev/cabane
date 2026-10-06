import { defineFurnishingModel } from "@cabane/engine";
import { CubeStorage } from "../presets/children-bedroom/cube-storage";

export const cubeStorageDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / .85, size[1] / 1.202, size[2] / .412]}><CubeStorage /></group>,
  label: "Cube storage", category: "Children", defaultSize: [.85, 1.202, .412], bounds: { min: [-.425, 0, -.17], max: [.425, 1.202, .242] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 24, triangles: 4_500 },
});

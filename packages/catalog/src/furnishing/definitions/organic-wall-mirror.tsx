import { defineFurnishingModel } from "@cabane/engine";
import { OrganicWallMirror } from "../presets/decor/organic-wall-mirror";

export const organicWallMirrorDefinition = defineFurnishingModel({
  defaultRoomType: "hallway",
  component: ({ size }) => (
    <group scale={[size[0] / 0.76, size[1] / 1.1, size[2] / 0.09]}>
      <OrganicWallMirror />
    </group>
  ),
  label: "Organic wall mirror",
  category: "Hallway",
  defaultSize: [0.76, 1.1, 0.09],
  bounds: { min: [-0.38, -0.55, -0.035], max: [0.38, 0.55, 0.055] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: true,
  complexity: { visibleMeshes: 4, triangles: 1_200 },
});

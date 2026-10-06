import { defineFurnishingModel } from "@cabane/engine";
import { PottedPlant } from "../presets/decor";
export const pottedPlantDefinition = defineFurnishingModel({
  defaultRoomType: "living-room",
  component: ({ size, variant }) => (
    <group scale={[size[0] / 0.615, size[1] / 1.105, size[2] / 0.44]}>
      <PottedPlant
        {...(variant === "white" ? { potColor: "#eeeae1", potOutlineColor: "#a6a399" } : {})}
      />
    </group>
  ),
  label: "Potted plant",
  category: "Decor",
  variants: [
    { id: "default", label: "Terracotta pot" },
    { id: "white", label: "White pot" },
  ],
  defaultSize: [0.615, 1.105, 0.44],
  bounds: { min: [-0.3075, 0, -0.22], max: [0.3075, 1.105, 0.22] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 4, triangles: 1_200 },
});

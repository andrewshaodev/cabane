import { defineFurnishingModel } from "@cabane/engine";
import { ChildrenBedroomFrenchDoorCurtains } from "./french-door-curtains";

export const childrenCurtainDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size, color }) => (
    <group scale={[size[0] / 1.9, size[1] / 2.205, size[2] / 0.076]}>
      <ChildrenBedroomFrenchDoorCurtains color={color} />
    </group>
  ),
  label: "Children's curtains",
  defaultColor: "#d8d0c4",
  category: "Children",
  defaultSize: [1.9, 2.205, 0.076],
  bounds: { min: [-0.95, 0.08, -0.01], max: [0.95, 2.285, 0.066] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: true,
  complexity: { visibleMeshes: 12, triangles: 3_200 },
});

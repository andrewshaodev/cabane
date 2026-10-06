import { defineFurnishingModel } from "@cabane/engine";
import { LouveredCloset } from "../presets/entryway/louvered-closet";

export const louveredClosetDefinition = defineFurnishingModel({
  defaultRoomType: "entryway",
  component: ({ size }) => (
    <group
      rotation={[0, -Math.PI / 2, 0]}
      scale={[size[2] / .113, size[1] / 1.735, size[0] / 1.6515]}
    >
      <LouveredCloset />
    </group>
  ),
  label: "Louvered closet", category: "Entrance",
  defaultSize: [1.6515, 1.735, .113],
  bounds: { min: [-.82575, 0, -.031], max: [.82575, 1.735, .082] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall",
  outlineContact: true, complexity: { visibleMeshes: 120, triangles: 18_000 },
});

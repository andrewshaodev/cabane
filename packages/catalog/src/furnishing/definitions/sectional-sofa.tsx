import { defineFurnishingModel } from "@cabane/engine";
import { CustomSectionalSofa } from "../presets/living-room/sectional-sofa";

export const sectionalSofaDefinition = defineFurnishingModel({
  defaultRoomType: "living-room",
  component: ({ size, variant }) => <group scale={[size[0] / 2.93, size[1] / 1.227, size[2] / 1.63]}><CustomSectionalSofa variant={variant} /></group>,
  variants: [
    { id: "default", label: "Classic — left chaise (front view)" },
    { id: "cozy", label: "Cozy — left chaise (front view)" },
    { id: "right", label: "Classic — right chaise (front view)" },
    { id: "cozy-right", label: "Cozy — right chaise (front view)" },
  ],
  label: "Sectional sofa", category: "Living room", defaultSize: [2.93, 1.227, 1.63], bounds: { min: [-1.465, 0, -.42], max: [1.465, 1.227, 1.21] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 37, triangles: 15_000 },
});

import { defineFurnishingModel, type SceneModelProps } from "@cabane/engine";
import { KitchenCabinetry } from "./kitchen-cabinetry";
import { OvenAndHob } from "./oven-and-hob";
import { IntegratedMicrowave } from "./integrated-microwave";
import { KitchenSink } from "./kitchen-sink";
import { KitchenPeninsula } from "./kitchen-peninsula";

function EquippedKitchenModel({ size }: SceneModelProps) {
  return (
    <group name="equipped-kitchen-model" scale={[size[0] / 3.89, size[1] / 2.23, size[2] / 2.54]}>
      <KitchenCabinetry />
      <OvenAndHob />
      <IntegratedMicrowave />
      <KitchenSink />
      <KitchenPeninsula />
    </group>
  );
}

export const equippedKitchenModel = defineFurnishingModel({
  defaultRoomType: "kitchen",
  component: EquippedKitchenModel,
  label: "Equipped kitchen",
  category: "Kitchen",
  defaultSize: [3.89, 2.23, 2.54],
  bounds: { min: [0.06, 0, 0.01], max: [3.95, 2.23, 2.55] },
  resizePolicy: { kind: "axes", axes: ["width", "depth"] },
  preferredPlacement: "wall",
  outlineContact: true,
  complexity: { visibleMeshes: 180, triangles: 34_000 },
});

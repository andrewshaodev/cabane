import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const LAUNDRY_CARRY_BASKET_SIZE = [0.6, 0.35, 0.4] as const;

/** Open cream slatted basket with reinforced grip rims. */
export function LaundryCarryBasket({
  size = LAUNDRY_CARRY_BASKET_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="laundry-carry-basket"
      scale={[size[0] / 0.6, size[1] / 0.35, size[2] / 0.4]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="base"
        size={[0.6, 0.025, 0.4]}
        position={[0, 0.0125, 0]}
        color="#e8e5dc"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="grip-rim"
        size={[0.6, 0.045, 0.02]}
        position={[0, 0.3275, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.27, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.21600000000000003, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.16200000000000003, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.10800000000000001, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.05400000000000002, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.0, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.05399999999999999, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.10799999999999998, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.16199999999999998, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.21599999999999997, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.27, 0.1675, -0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="grip-rim"
        size={[0.6, 0.045, 0.02]}
        position={[0, 0.3275, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.27, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.21600000000000003, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.16200000000000003, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.10800000000000001, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[-0.05400000000000002, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.0, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.05399999999999999, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.10799999999999998, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.16199999999999998, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.21599999999999997, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.025, 0.285, 0.02]}
        position={[0.27, 0.1675, 0.19]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="grip-rim"
        size={[0.02, 0.045, 0.36]}
        position={[-0.29, 0.3275, 0]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, -0.16]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, -0.10666700000000001]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, -0.053334000000000006]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, -1.000000000001e-6]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, 0.05333199999999999]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, 0.10666499999999998]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[-0.29, 0.1675, 0.159998]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="grip-rim"
        size={[0.02, 0.045, 0.36]}
        position={[0.29, 0.3275, 0]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, -0.16]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, -0.10666700000000001]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, -0.053334000000000006]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, -1.000000000001e-6]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, 0.05333199999999999]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, 0.10666499999999998]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.285, 0.025]}
        position={[0.29, 0.1675, 0.159998]}
        color="#e8e5dc"
        radius={0.006}
      />
    </group>
  );
}

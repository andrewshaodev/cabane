import { type SceneItemSize, ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const TWO_TIER_BAR_CART_SIZE = [0.7, 0.8, 0.42] as const;

/** Two walnut trays on a brass frame with four dark wheels and a push handle. */
export function TwoTierBarCart({ size = TWO_TIER_BAR_CART_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="two-tier-bar-cart"
      scale={[size[0] / 0.7, size[1] / 0.8, size[2] / 0.42]}
      userData={{ walkCollider: true }}
    >
      <mesh name="wheel" position={[-0.29, 0.04, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <ToonMaterial color="#414442" />
      </mesh>
      <mesh name="wheel" position={[-0.29, 0.04, 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <ToonMaterial color="#414442" />
      </mesh>
      <mesh name="wheel" position={[0.29, 0.04, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <ToonMaterial color="#414442" />
      </mesh>
      <mesh name="wheel" position={[0.29, 0.04, 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <ToonMaterial color="#414442" />
      </mesh>
      <RoundedFurniturePanel
        name="post"
        size={[0.025, 0.66, 0.025]}
        position={[-0.3, 0.41, -0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="post"
        size={[0.025, 0.66, 0.025]}
        position={[-0.3, 0.41, 0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="post"
        size={[0.025, 0.66, 0.025]}
        position={[0.3, 0.41, -0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="post"
        size={[0.025, 0.66, 0.025]}
        position={[0.3, 0.41, 0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="tray"
        size={[0.7, 0.035, 0.42]}
        position={[0, 0.14, 0]}
        color="#795943"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="tray"
        size={[0.7, 0.035, 0.42]}
        position={[0, 0.65, 0]}
        color="#795943"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="tray-rim"
        size={[0.7, 0.05, 0.02]}
        position={[0, 0.1825, -0.2]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="tray-rim"
        size={[0.7, 0.05, 0.02]}
        position={[0, 0.1825, 0.2]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="tray-rim"
        size={[0.7, 0.05, 0.02]}
        position={[0, 0.6925, -0.2]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="tray-rim"
        size={[0.7, 0.05, 0.02]}
        position={[0, 0.6925, 0.2]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="handle-support"
        size={[0.025, 0.13, 0.025]}
        position={[0.3, 0.735, -0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="handle-support"
        size={[0.025, 0.13, 0.025]}
        position={[0.3, 0.735, 0.17]}
        color="#aa8851"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="push-handle"
        size={[0.025, 0.025, 0.365]}
        position={[0.3, 0.7875, 0]}
        color="#aa8851"
        radius={0.004}
      />
    </group>
  );
}

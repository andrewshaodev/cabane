import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { IntegratedCompactBasin } from "./integrated-compact-basin";
export const TWO_DRAWER_BASIN_VANITY_SIZE = [0.83, 0.64, 0.49] as const;
export function TwoDrawerBasinVanity({
  size = TWO_DRAWER_BASIN_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="two-drawer-basin-vanity"
      scale={[size[0] / 0.83, size[1] / 0.64, size[2] / 0.49]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="drawer-case-back"
        size={[0.794, 0.6, 0.016]}
        position={[0, 0.31, -0.237]}
        color="#e8e8e2"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="drawer-case-bottom"
        size={[0.794, 0.02, 0.445]}
        position={[0, 0.01, -0.0145]}
        color="#e8e8e2"
        radius={0.003}
        outline={false}
      />
      {[-0.403, 0.403].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="drawer-case-side"
          size={[0.02, 0.617, 0.445]}
          position={[x, 0.3085, -0.0225]}
          color="#e8e8e2"
          radius={0.004}
          outline={false}
        />
      ))}
      {[0.155, 0.46].map((y) => (
        <group key={y}>
          <RoundedFurniturePanel
            name="vanity-drawer-front"
            size={[0.802, 0.298, 0.018]}
            position={[0, y, 0.21]}
            color="#efeee8"
            radius={0.004}
            outline={false}
          />
          <RoundedFurniturePanel
            name="vanity-drawer-pull"
            size={[0.16, 0.024, 0.027]}
            position={[0, y + 0.134, 0.2305]}
            color="#f5f4ec"
            radius={0.004}
            outline={false}
          />
        </group>
      ))}
      <group position={[0, 0.14, 0]} scale={[0.83 / 0.6, 1, 0.49 / 0.35]}>
        <IntegratedCompactBasin />
      </group>
    </group>
  );
}

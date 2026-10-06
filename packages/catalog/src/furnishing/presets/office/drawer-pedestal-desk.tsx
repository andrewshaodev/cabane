import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DRAWER_PEDESTAL_DESK_SIZE = [1.8, 0.75, 0.6] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function DrawerPedestalDesk({ size = DRAWER_PEDESTAL_DESK_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="drawer-pedestal-desk"
      scale={[size[0] / 1.8, size[1] / 0.75, size[2] / 0.6]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        size={[1.8, 0.03, 0.6]}
        position={[0, 0.735, 0]}
        color="#bf9663"
        radius={0.005}
      />
      {[-0.69, 0.69].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            size={[0.42, 0.72, 0.55]}
            position={[x, 0.36, -0.025]}
            color="#deded7"
            radius={0.003}
          />
          {[0.09, 0.235, 0.38, 0.525, 0.66].map((y, i) => (
            <group key={y}>
              <RoundedFurniturePanel
                size={[0.405, i === 4 ? 0.1 : 0.135, 0.025]}
                position={[x, y, 0.2625]}
                color="#f1f0e9"
                radius={0.002}
              />
              <RoundedFurniturePanel
                size={[0.14, 0.014, 0.015]}
                position={[x, y + 0.045, 0.2925]}
                color="#494945"
                radius={0.005}
                outline={false}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

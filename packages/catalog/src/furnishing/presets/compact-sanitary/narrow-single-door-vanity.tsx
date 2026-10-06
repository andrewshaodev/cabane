import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { IntegratedCompactBasin } from "./integrated-compact-basin";
export const NARROW_SINGLE_DOOR_VANITY_SIZE = [0.335, 0.56, 0.295] as const;
/** Small wall-supported black cabinet with one door and a white recessed ceramic basin. */
export function NarrowSingleDoorVanity({
  size = NARROW_SINGLE_DOOR_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="narrow-single-door-vanity"
      scale={[size[0] / 0.335, size[1] / 0.56, size[2] / 0.295]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="small-vanity-back"
        size={[0.323, 0.535, 0.014]}
        position={[0, 0.2675, -0.1405]}
        color="#282b28"
        radius={0.002}
        outline={false}
      />
      {[-0.1555, 0.1555].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="small-vanity-side"
          size={[0.012, 0.535, 0.264]}
          position={[x, 0.2675, -0.0085]}
          color="#282b28"
          radius={0.002}
          outline={false}
        />
      ))}
      <RoundedFurniturePanel
        name="small-vanity-bottom"
        size={[0.311, 0.014, 0.264]}
        position={[0, 0.007, -0.0085]}
        color="#282b28"
        radius={0.002}
        outline={false}
      />
      <RoundedFurniturePanel
        name="single-vanity-door"
        size={[0.319, 0.526, 0.012]}
        position={[0, 0.268, 0.1285]}
        color="#282b28"
        radius={0.002}
        outline={false}
      />
      <group position={[0, 0.06, 0]} scale={[0.335 / 0.6, 1, 0.295 / 0.35]}>
        <IntegratedCompactBasin />
      </group>
    </group>
  );
}

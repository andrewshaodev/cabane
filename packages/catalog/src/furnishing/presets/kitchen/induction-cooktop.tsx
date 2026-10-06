import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const INDUCTION_COOKTOP_SIZE = [0.54, 0.01, 0.48] as const;
/** The glass meets its support at Y=0; ring markings clear its top by 2 mm. */
export function InductionCooktop({ size = INDUCTION_COOKTOP_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="induction-cooktop" scale={[size[0] / 0.54, size[1] / 0.01, size[2] / 0.48]}>
      <RoundedFurniturePanel
        name="hob-glass"
        size={[0.54, 0.008, 0.48]}
        position={[0, 0.004, 0]}
        color="#252e2d"
        radius={0.003}
      />
      {[-0.14, 0.14].flatMap((x) =>
        [-0.12, 0.12].map((z) => (
          <mesh
            name="hob-ring-marking"
            key={x + "-" + z}
            position={[x, 0.01, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.068, 0.073, 24]} />
            <ToonMaterial color="#89928b" />
          </mesh>
        )),
      )}
    </group>
  );
}

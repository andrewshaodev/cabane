import { KitchenBaseCabinet } from "./kitchen-base-cabinet";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const KITCHEN_HOB_CABINET_SIZE = [0.6, 0.91, 0.63] as const;
export function KitchenHobCabinet({
  size = KITCHEN_HOB_CABINET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="kitchen-hob-cabinet"
      scale={[size[0] / 0.6, size[1] / 0.91, size[2] / 0.63]}
      userData={{ walkCollider: true }}
    >
      <KitchenBaseCabinet size={[0.6, 0.9, 0.63]} variant={variant} />
      <RoundedFurniturePanel
        name="hob-glass"
        size={[0.54, 0.01, 0.48]}
        position={[0, 0.905, 0]}
        color="#252e2d"
        radius={0.008}
      />
      {[-0.14, 0.14].flatMap((x) =>
        [-0.12, 0.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.91, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.068, 0.073, 24]} />
            <ToonMaterial color="#89928b" />
          </mesh>
        )),
      )}
    </group>
  );
}

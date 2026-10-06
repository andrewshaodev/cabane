import type { SceneModelProps } from "@cabane/engine";
import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../../construction";
import { FoldingFrameStrip as Strip } from "./folding-frame-strip";
export const SLATTED_FOLDING_TABLE_SIZE = [0.6, 0.72, 0.6] as const;
export function SlattedFoldingTable({
  size = SLATTED_FOLDING_TABLE_SIZE,
}: Pick<SceneModelProps, "size">) {
  return (
    <group
      name="slatted-folding-table"
      userData={{ walkCollider: true }}
      scale={[size[0] / 0.6, size[1] / 0.72, size[2] / 0.6]}
    >
      {Array.from({ length: 7 }, (_, i) => (
        <Panel
          key={i}
          name="bistro-table-top-slat"
          size={[0.6, 0.03, 0.54 / 7]}
          position={[0, 0.705, -0.3 + 0.54 / 14 + i * (0.54 / 7 + 0.01)]}
          color="#b28a5d"
          radius={0.003}
        />
      ))}
      {[-0.25, 0.25].map((x) => (
        <group key={x}>
          {[-0.255, 0.255].map((z) => (
            <mesh key={z} name="bistro-table-foot" position={[x, 0.012, z]}>
              <boxGeometry args={[0.024, 0.024, 0.034]} />
              <ToonMaterial color="#303632" />
            </mesh>
          ))}
          <Strip name="bistro-table-cross-leg" from={[x, 0.018, -0.255]} to={[x, 0.69, 0.255]} />
          <Strip name="bistro-table-cross-leg" from={[x, 0.018, 0.255]} to={[x, 0.69, -0.255]} />
          <mesh name="bistro-table-hinge" position={[x, 0.354, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.026, 12]} />
            <ToonMaterial color="#414741" />
          </mesh>
        </group>
      ))}
      {[-0.255, 0.255].map((z) => (
        <Panel
          key={z}
          name="bistro-table-top-crossbar"
          size={[0.518, 0.022, 0.024]}
          position={[0, 0.684, z]}
          color="#343936"
          radius={0.001}
        />
      ))}
    </group>
  );
}

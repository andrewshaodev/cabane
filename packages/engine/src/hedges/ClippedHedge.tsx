import { ClippedHedgeFoliage } from "./ClippedHedgeFoliage";
import { ToonMaterial } from "../rendering";

export function ClippedHedge({
  length,
  height,
  width,
}: {
  length: number;
  height: number;
  width: number;
}) {
  return (
    <group>
      <ClippedHedgeFoliage length={length} height={height} width={width} />
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, width]} />
        <ToonMaterial color="#436e38" />
      </mesh>
      <mesh position={[0, height - 0.025, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.05, width]} />
        <ToonMaterial color="#668847" />
      </mesh>
    </group>
  );
}

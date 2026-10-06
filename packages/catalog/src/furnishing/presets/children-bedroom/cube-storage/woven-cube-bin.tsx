import { Outlines, ToonMaterial } from "@cabane/engine";
import { WICKER, WICKER_LIGHT } from "./cube-storage-finish";

export function WovenCubeBin({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <group position={[x, y, 0.038]}>
      <mesh castShadow>
        <boxGeometry args={[0.31, 0.27, 0.285]} />
        <ToonMaterial color={WICKER} />
        <Outlines color="#745438" thickness={0.004} screenspace={false} />
      </mesh>
      {[-0.11, -0.055, 0, 0.055, 0.11].map((offset) => (
        <mesh key={offset} position={[offset, 0, 0.151]}>
          <boxGeometry args={[0.009, 0.235, 0.01]} />
          <ToonMaterial color={WICKER_LIGHT} />
        </mesh>
      ))}
      {[-0.09, -0.03, 0.03, 0.09].map((offset) => (
        <mesh key={offset} position={[0, offset, 0.153]}>
          <boxGeometry args={[0.275, 0.009, 0.01]} />
          <ToonMaterial color="#956f49" />
        </mesh>
      ))}
      <mesh position={[0, 0.095, 0.161]}>
        <boxGeometry args={[0.09, 0.025, 0.014]} />
        <ToonMaterial color="#68503b" />
      </mesh>
    </group>
  );
}

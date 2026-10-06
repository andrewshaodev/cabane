import { Outlines, ToonMaterial } from "@cabane/engine";
import { WICKER, WICKER_LIGHT } from "./changing-table-finish";

export function WickerFront() {
  return (
    <group position={[0, 0.43, 0.226]}>
      <mesh castShadow>
        <boxGeometry args={[0.56, 0.3, 0.028]} />
        <ToonMaterial color={WICKER} />
        <Outlines color="#75563c" thickness={0.004} screenspace={false} />
      </mesh>
      {[-0.22, -0.146, -0.073, 0, 0.073, 0.146, 0.22].map((x) => (
        <mesh key={`wicker-v-${x}`} position={[x, 0, 0.019]}>
          <cylinderGeometry args={[0.005, 0.005, 0.265, 6]} />
          <ToonMaterial color={WICKER_LIGHT} />
        </mesh>
      ))}
      {[-0.105, -0.035, 0.035, 0.105].map((y) => (
        <mesh
          key={`wicker-h-${y}`}
          position={[0, y, 0.021]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.005, 0.005, 0.52, 6]} />
          <ToonMaterial color="#96714d" />
        </mesh>
      ))}
      <mesh position={[0, 0.105, 0.03]}>
        <boxGeometry args={[0.1, 0.025, 0.012]} />
        <ToonMaterial color="#6f563f" />
      </mesh>
    </group>
  );
}

import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";

export function GlassDoorHandle({ width, side }: { width: number; side: -1 | 1 }) {
  return (
    <group
      name="opening-glass-door-handle"
      position={[side * (width / 2 - Math.min(0.1, width * 0.22)), -0.02, 0]}
    >
      {([-1, 1] as const).map((face) => (
        <RoundedBox
          key={face}
          args={[0.025, 0.24, 0.026]}
          radius={0.008}
          smoothness={2}
          position={[0, 0, face * 0.075]}
          castShadow
        >
          <ToonMaterial color="#4f5655" />
          <Outlines thickness={0.004} color="#353938" screenspace={false} />
        </RoundedBox>
      ))}
    </group>
  );
}

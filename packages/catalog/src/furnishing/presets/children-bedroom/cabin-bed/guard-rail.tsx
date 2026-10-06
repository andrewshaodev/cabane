import { Timber } from "./timber";

export function GuardRail({ z }: { readonly z: number }) {
  const slats = [-0.22, -0.11, 0, 0.11, 0.22];
  return (
    <group position={[-0.565, 0, z]}>
      {[0.25, 0.62].map((y) => (
        <Timber
          key={y}
          length={0.64}
          radius={0.024}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
      {slats.map((offset) => (
        <Timber key={offset} length={0.35} radius={0.018} position={[0, 0.435, offset]} />
      ))}
    </group>
  );
}

import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { OutdoorBasin } from "./outdoor-basin";

export const FLOWER_POT_SIZE = [0.5, 0.8, 0.5] as const;
/** Generic flowering terrace pot; deterministic stems and low-poly flower heads. */
export function FlowerPot({
  size = FLOWER_POT_SIZE,
  variant = "lavender",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const flower = variant === "white" ? "#f0ead9" : variant === "coral" ? "#c87a68" : "#a095bb";
  return (
    <group scale={[size[0] / 0.5, size[1] / 0.8, size[2] / 0.5]}>
      <OutdoorBasin
        name="flower-pot"
        radius={0.25}
        height={0.36}
        position={[0, 0, 0]}
        color="#b67b5d"
      />
      <mesh position={[0, 0.325, 0]}>
        <cylinderGeometry args={[0.215, 0.215, 0.02, 24]} />
        <ToonMaterial color="#66513d" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        const x = i === 8 ? 0 : Math.cos(angle) * 0.13;
        const z = i === 8 ? 0 : Math.sin(angle) * 0.13;
        const top = i === 8 ? 0.76 : 0.59 + (i % 3) * 0.055;
        return (
          <group key={i}>
            <mesh position={[x, (top + 0.33) / 2, z]}>
              <cylinderGeometry args={[0.007, 0.009, top - 0.33, 6]} />
              <ToonMaterial color="#75865a" />
            </mesh>
            <mesh position={[x, top, z]} scale={[0.025, 0.04, 0.025]}>
              <sphereGeometry args={[1, 8, 6]} />
              <ToonMaterial color={flower} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[x + side * 0.025, 0.45 + (i % 2) * 0.04, z]}
                rotation={[0, 0, side * 0.65]}
                scale={[0.025, 0.075, 0.012]}
              >
                <sphereGeometry args={[1, 8, 6]} />
                <ToonMaterial color="#8a9b6b" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

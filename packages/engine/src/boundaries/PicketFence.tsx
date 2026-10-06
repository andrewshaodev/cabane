import { BoundaryBeam, type BoundaryDimensions } from "./BoundaryBeam";
import { ToonMaterial } from "../rendering";
export function PicketFence({ length, height, width }: BoundaryDimensions) {
  const count = Math.max(1, Math.ceil(length / 0.18));
  const step = length / count;
  const post = Math.min(width, step * 0.45, 0.12);
  return (
    <group>
      {Array.from({ length: count + 1 }, (_, i) => (
        <BoundaryBeam
          key={i}
          position={[
            -length / 2 + post / 2 + (i * (length - post)) / count,
            (height - 0.08) / 2,
            0,
          ]}
          size={[post, height - 0.08, width]}
          color="#e6dfcc"
        />
      ))}
      {Array.from({ length: count + 1 }, (_, i) => (
        <mesh
          key={`tip-${i}`}
          position={[-length / 2 + post / 2 + (i * (length - post)) / count, height - 0.04, 0]}
          castShadow
        >
          <coneGeometry args={[post * 0.7, 0.08, 4]} />
          <ToonMaterial color="#e6dfcc" />
        </mesh>
      ))}
      {[0.25, 0.75].map((fraction) => (
        <BoundaryBeam
          key={fraction}
          position={[0, height * fraction, 0]}
          size={[length, Math.min(0.08, height * 0.07), width * 0.65]}
          color="#e6dfcc"
        />
      ))}
    </group>
  );
}

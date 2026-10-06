import { BoundaryBeam, type BoundaryDimensions } from "./BoundaryBeam";
export function PostRailFence({ length, height, width }: BoundaryDimensions) {
  const count = Math.max(1, Math.ceil(length / 1.8));
  const step = length / count;
  const post = Math.min(width, step * 0.45, 0.12);
  return (
    <group>
      {Array.from({ length: count + 1 }, (_, i) => (
        <BoundaryBeam
          key={i}
          position={[-length / 2 + post / 2 + (i * (length - post)) / count, height / 2, 0]}
          size={[post, height, width]}
          color="#93704b"
        />
      ))}
      {[0.25, 0.75].map((fraction) => (
        <BoundaryBeam
          key={fraction}
          position={[0, height * fraction, 0]}
          size={[length, Math.min(0.08, height * 0.07), width * 0.65]}
          color="#93704b"
        />
      ))}
    </group>
  );
}

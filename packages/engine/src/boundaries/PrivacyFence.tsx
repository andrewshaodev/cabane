import { BoundaryBeam, type BoundaryDimensions } from "./BoundaryBeam";
export function PrivacyFence({ length, height, width }: BoundaryDimensions) {
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
          color="#98704d"
        />
      ))}
      {Array.from({ length: Math.max(1, Math.ceil(height / 0.18)) }, (_, i) => {
        const rows = Math.max(1, Math.ceil(height / 0.18));
        return (
          <BoundaryBeam
            key={`board-${i}`}
            position={[0, ((i + 0.5) * height) / rows, 0]}
            size={[length, (height / rows) * 0.94, width * 0.7]}
            color={i % 2 ? "#98704d" : "#aa8059"}
          />
        );
      })}
    </group>
  );
}

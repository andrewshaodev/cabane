import { BoundaryBeam, type BoundaryDimensions } from "./BoundaryBeam";
export function MasonryBoundary({ length, height, width }: BoundaryDimensions) {
  const rows = Math.max(1, Math.ceil(height / 0.25));
  const columns = Math.max(1, Math.ceil(length / 0.65));
  return (
    <group>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, col) => (
          <BoundaryBeam
            key={`${row}-${col}`}
            position={[
              -length / 2 + ((col + 0.5) * length) / columns,
              (row + 0.5) * ((height * 0.9) / rows),
              0,
            ]}
            size={[length / columns, (height * 0.9) / rows, width * 0.9]}
            color={(row + col) % 2 ? "#a59c8c" : "#b5ac9c"}
          />
        )),
      )}
      <BoundaryBeam
        position={[0, height * 0.95, 0]}
        size={[length, height * 0.1, width]}
        color="#d1c7b5"
      />
    </group>
  );
}

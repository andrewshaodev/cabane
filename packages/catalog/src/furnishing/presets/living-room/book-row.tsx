import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const BOOK_ROW_SIZE = [0.4, 0.28, 0.18] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function BookRow({ size = BOOK_ROW_SIZE }: { size?: SceneItemSize; variant?: string }) {
  return (
    <group name="book-row" scale={[size[0] / 0.4, size[1] / 0.28, size[2] / 0.18]}>
      {Array.from({ length: 10 }, (_, i) => {
        const height = i === 3 ? 0.28 : 0.2 + (i % 4) * 0.02;
        return (
          <mesh key={i} position={[-0.18 + i * 0.04, height / 2, 0]}>
            <boxGeometry args={[0.04, height, 0.18]} />
            <ToonMaterial color={["#e5dfcc", "#c1c7b9", "#364940", "#d3aa60", "#b46d53"][i % 5]} />
          </mesh>
        );
      })}
    </group>
  );
}

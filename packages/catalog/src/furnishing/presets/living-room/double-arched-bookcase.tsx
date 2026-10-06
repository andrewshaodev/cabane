import { ArchedBookcaseFrame } from "./arched-bookcase-frame";
import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const DOUBLE_ARCHED_BOOKCASE_SIZE = [1, 1.73, 0.36] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function DoubleArchedBookcase({
  size = DOUBLE_ARCHED_BOOKCASE_SIZE,
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="double-arched-bookcase" scale={[size[0] / 1, size[1] / 1.73, size[2] / 0.36]}>
      <ArchedBookcaseFrame />
      {[-0.245, 0.245].map((x, i) => (
        <group key={x}>
          {(i === 0 ? [0.62, 1.16] : [0.48, 0.98, 1.39]).map((y) => (
            <RoundedFurniturePanel
              name="arched-bookcase-shelf"
              key={y}
              size={[0.44, 0.025, 0.34]}
              position={[x, y, 0]}
              color="#c7a67b"
              radius={0.002}
              outlineColor="#9c7c58"
            />
          ))}
        </group>
      ))}
    </group>
  );
}

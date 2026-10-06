import { Outlines, ToonMaterial } from "@cabane/engine";
import type { WallSpec } from "@cabane/engine";

export function DoorFrame({
  wall,
  width,
  height,
}: {
  wall: WallSpec;
  width: number;
  height: number;
}) {
  return (
    <>
      {[
        [0, height / 2, 0.07, height + 0.08],
        [width, height / 2, 0.07, height + 0.08],
        // Cover the lintel underside without sharing its plane or touching the leaf.
        [width / 2, height + 0.031, width + 0.07, 0.078],
      ].map(([x, y, itemWidth, itemHeight], index) => (
        <mesh key={index} position={[x, y, 0]} castShadow>
          <boxGeometry args={[itemWidth, itemHeight, wall.thicknessMeters + 0.025]} />
          <ToonMaterial color="#d8d2c6" />
          <Outlines color="#676965" thickness={0.006} screenspace={false} />
        </mesh>
      ))}
    </>
  );
}

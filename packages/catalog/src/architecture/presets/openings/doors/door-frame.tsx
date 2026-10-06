import {
  DOOR_FRAME_EXTRA_DEPTH_METERS,
  DOOR_FRAME_JAMB_WIDTH_METERS,
} from "./door-frame-dimensions";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { WallSpec } from "@cabane/engine";

export function DoorFrame({
  wall,
  width,
  height,
  color = "#d8d2c6",
}: {
  wall: WallSpec;
  width: number;
  height: number;
  color?: string;
}) {
  return (
    <>
      {[
        [0, height / 2, DOOR_FRAME_JAMB_WIDTH_METERS, height + 0.08],
        [width, height / 2, DOOR_FRAME_JAMB_WIDTH_METERS, height + 0.08],
        // Cover the lintel underside without sharing its plane or touching the leaf.
        [width / 2, height + 0.031, width + DOOR_FRAME_JAMB_WIDTH_METERS, 0.078],
      ].map(([x, y, itemWidth, itemHeight], index) => (
        <mesh name={`opening-door-frame-${index}`} key={index} position={[x, y, 0]} castShadow>
          <boxGeometry
            args={[itemWidth, itemHeight, wall.thicknessMeters + DOOR_FRAME_EXTRA_DEPTH_METERS]}
          />
          <ToonMaterial color={color} />
          <Outlines color="#676965" thickness={0.006} screenspace={false} />
        </mesh>
      ))}
    </>
  );
}

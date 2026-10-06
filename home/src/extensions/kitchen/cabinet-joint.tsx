import { ToonMaterial } from "@cabane/engine";
import type { KitchenVector3 } from "./kitchen-finish";

export function CabinetJoint({
  from,
  to,
  color,
  thickness = 0.006,
}: {
  readonly from: KitchenVector3;
  readonly to: KitchenVector3;
  readonly color: string;
  readonly thickness?: number;
}) {
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  const deltaZ = to[2] - from[2];
  const length = Math.hypot(deltaX, deltaY, deltaZ);
  const horizontalLength = Math.hypot(deltaX, deltaZ);
  const rotationY = -Math.atan2(deltaZ, deltaX);
  const rotationZ = Math.atan2(deltaY, horizontalLength);

  return (
    <mesh
      position={[
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
        (from[2] + to[2]) / 2,
      ]}
      rotation={[0, rotationY, rotationZ]}
    >
      <boxGeometry args={[length, thickness, thickness]} />
      <ToonMaterial color={color} />
    </mesh>
  );
}

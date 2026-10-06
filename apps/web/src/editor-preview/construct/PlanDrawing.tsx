import { ToonMaterial, type ToonMaterialProps } from "@cabane/engine";
import { memo } from "react";
import { DoubleSide } from "three";

export const noPlanRaycast = () => undefined;

export function PlanOverlayMaterial({ color = "#fff7f1", ...props }: ToonMaterialProps) {
  return <ToonMaterial {...props} color="#000000" emissive={color} emissiveIntensity={1} toneMapped={false} />;
}

export function PlanMaterial({ color, opacity = 1, overlay = false }: {
  color: string;
  opacity?: number;
  overlay?: boolean;
}) {
  return <ToonMaterial color="#000000" emissive={color} emissiveIntensity={1}
    toneMapped={false} side={DoubleSide} transparent={opacity < 1} opacity={opacity}
    depthTest={!overlay} depthWrite={!overlay && opacity === 1} />;
}

export const PlanStroke = memo(function PlanStroke({
  from, to, color, width = .025, elevation = .045, overlay = false,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  color: string;
  width?: number;
  elevation?: number;
  overlay?: boolean;
}) {
  const dx = to[0] - from[0], dz = to[1] - from[1];
  return <mesh position={[(from[0] + to[0]) / 2, elevation, (from[1] + to[1]) / 2]}
    rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]} raycast={noPlanRaycast}
    renderOrder={overlay ? 30 : 0}>
    <planeGeometry args={[Math.hypot(dx, dz), width]} /><PlanMaterial color={color} overlay={overlay} />
  </mesh>;
});

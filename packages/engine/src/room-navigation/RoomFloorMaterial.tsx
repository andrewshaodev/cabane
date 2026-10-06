import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, type MeshToonMaterial } from "three";
import { ToonMaterial, type ToonMaterialProps } from "../rendering";

export function RoomFloorMaterial({
  emphasis,
  reducedMotion,
  color,
  ...props
}: Omit<ToonMaterialProps, "color"> & {
  color: string;
  emphasis: number;
  reducedMotion: boolean;
}) {
  const material = useRef<MeshToonMaterial>(null);
  const base = useMemo(() => new Color(color), [color]);
  const level = useRef(emphasis);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [emphasis, color, reducedMotion, invalidate]);
  useFrame((_state, delta) => {
    if (!material.current) return;
    const next = reducedMotion
      ? emphasis
      : level.current + (emphasis - level.current) * (1 - Math.exp(-12 * delta));
    level.current = Math.abs(next - emphasis) < 0.001 ? emphasis : next;
    material.current.color.copy(base).multiplyScalar(level.current);
    if (level.current !== emphasis) invalidate();
  });
  return <ToonMaterial {...props} ref={material} color={base.clone().multiplyScalar(emphasis)} />;
}

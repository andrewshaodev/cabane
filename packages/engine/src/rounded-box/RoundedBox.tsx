import { forwardRef, useEffect, useMemo, type ComponentProps } from "react";
import type { Mesh } from "three";
import { roundedBoxGeometry } from "./rounded-box-geometry";

type RoundedBoxProps = Omit<ComponentProps<"mesh">, "args" | "geometry"> & {
  args?: [number?, number?, number?]; radius?: number; steps?: number;
  smoothness?: number; bevelSegments?: number; creaseAngle?: number;
};
export const RoundedBox = forwardRef<Mesh, RoundedBoxProps>(function RoundedBox({
  args: [width = 1, height = 1, depth = 1] = [], radius = .05, steps = 1,
  smoothness = 4, bevelSegments = 4, creaseAngle = .4, children, ...props
}, ref) {
  const geometry = useMemo(() => roundedBoxGeometry(width, height, depth, radius,
    steps, smoothness, bevelSegments, creaseAngle),
  [width, height, depth, radius, steps, smoothness, bevelSegments, creaseAngle]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} ref={ref} geometry={geometry}>{children}</mesh>;
});

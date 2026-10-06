import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, Vector3, type DirectionalLight, type ShaderMaterial } from "three";
import { walkSkyFragmentShader, walkSkyVertexShader } from "./walk-sky-shader";

/** Direction-only background: no camera translation, scene depth, or picking. */
export function WalkSky({
  sunRef,
  daylight,
  overcast = 0,
  reducedMotion = false,
}: {
  sunRef: RefObject<DirectionalLight | null>;
  daylight: number;
  overcast?: number;
  reducedMotion?: boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      sunDirection: { value: new Vector3(-8, 14, 10).normalize() },
      sunColor: { value: new Color("#fff0d7") },
      zenithDay: { value: new Color("#6296bd") },
      horizonDay: { value: new Color("#e1e6d7") },
      zenithNight: { value: new Color("#101e36") },
      horizonNight: { value: new Color("#35465d") },
      duskColor: { value: new Color("#efb082") },
      daylight: { value: 1 },
      overcast: { value: 0 },
    }),
    [],
  );
  // Read lights after their update (-1), without taking ownership of rendering.
  useFrame((_, delta) => {
    const sun = sunRef.current;
    const live = material.current?.uniforms as typeof uniforms | undefined;
    if (!sun || !live) return;
    live.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();
    live.sunColor.value.copy(sun.color);
    const progress = reducedMotion ? 1 : 1 - Math.exp(-1.15 * delta);
    live.daylight.value += (daylight - live.daylight.value) * progress;
    live.overcast.value += (overcast - live.overcast.value) * progress;
  }, -0.5);
  return (
    <mesh name="walk-sky" frustumCulled={false} renderOrder={-1000} raycast={() => {}}>
      <sphereGeometry args={[1, 24, 12]} />
      <shaderMaterial
        ref={material}
        side={BackSide}
        depthWrite={false}
        depthTest={false}
        uniforms={uniforms}
        vertexShader={walkSkyVertexShader}
        fragmentShader={walkSkyFragmentShader}
      />
    </mesh>
  );
}

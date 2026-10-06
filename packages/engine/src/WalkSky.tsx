import { useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, Vector3, type DirectionalLight, type HemisphereLight } from "three";
import { walkSkyFragmentShader, walkSkyVertexShader } from "./walk-sky-shader";

/** Direction-only background: no camera translation, scene depth, or picking. */
export function WalkSky({
  sunRef,
  hemisphereRef,
}: {
  sunRef: RefObject<DirectionalLight | null>;
  hemisphereRef: RefObject<HemisphereLight | null>;
}) {
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
    }),
    [],
  );
  // Read lights after their update (-1), without taking ownership of rendering.
  useFrame(() => {
    const sun = sunRef.current;
    const hemisphere = hemisphereRef.current;
    if (!sun || !hemisphere) return;
    uniforms.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();
    uniforms.sunColor.value.copy(sun.color);
    uniforms.daylight.value = Math.min(1, Math.max(0, (hemisphere.intensity - 0.78) / 0.27));
  }, -0.5);
  return (
    <mesh name="walk-sky" frustumCulled={false} renderOrder={-1000} raycast={() => {}}>
      <sphereGeometry args={[1, 24, 12]} />
      <shaderMaterial
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

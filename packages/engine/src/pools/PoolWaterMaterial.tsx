import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type MeshToonMaterial } from "three";
import { ToonMaterial } from "../rendering";

/** Small analytic ripples: no textures, extra geometry, or reflection passes. */
export function PoolWaterMaterial({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const time = useMemo(() => ({ value: 0 }), []);
  const compile = useMemo<MeshToonMaterial["onBeforeCompile"]>(() => (shader) => {
    shader.uniforms.poolTime = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPoolPosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPoolPosition = position.xy;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform float poolTime;
        varying vec2 vPoolPosition;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        // Coordinates are in meters, so large and small pools share a ripple scale.
        vec2 p = vPoolPosition;
        float a = dot(p, vec2(3.1, 1.7)) + poolTime * 0.65;
        float b = dot(p, vec2(-1.8, 4.3)) - poolTime * 0.48;
        float c = dot(p, vec2(5.2, -2.6)) + poolTime * 0.34;
        vec2 slope = vec2(3.1, 1.7) * cos(a) * 0.012
          + vec2(-1.8, 4.3) * cos(b) * 0.008
          + vec2(5.2, -2.6) * cos(c) * 0.004;
        // The shape's local Y maps to world -Z; its surface stays perfectly flat.
        normal = normalize(mat3(viewMatrix) * vec3(-slope.x, 1.0, slope.y)) * faceDirection;
        vec3 poolView = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        float fresnel = pow(1.0 - clamp(dot(normal, poolView), 0.0, 1.0), 3.0);
        float crest = sin(a) * 0.5 + sin(b) * 0.3 + sin(c) * 0.2;
        float glint = smoothstep(0.55, 0.9, crest);
        // Tint before lighting: the sheen still responds to shadows and night mode.
        diffuseColor.rgb *= 0.94 + 0.07 * crest;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.63, 0.86, 0.89),
          0.24 * fresnel + 0.10 * glint);
        diffuseColor.a = mix(opacity, 0.93, fresnel);`);
  }, [time]);
  useFrame((_, delta) => {
    // Only advance on frames the scene already needs. Never wake an idle canvas.
    if (!reducedMotion) time.value += Math.min(delta, 0.05);
  });
  return <ToonMaterial color="#62b8c7" transparent opacity={0.78} side={DoubleSide}
    depthWrite={false} onBeforeCompile={compile} customProgramCacheKey={() => "pool-water-v1"} />;
}

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, type Mesh, type ShaderMaterial } from "three";
import { weatherParticleGeometry } from "./weather-particle-geometry";
import { weatherParticleFragment, weatherParticleVertex } from "./weather-particle-shaders";
import type { WeatherFrame } from "./WeatherScene";
import type { createWeatherShelter } from "./weather-shelter";

const keys = ["rain", "snow", "hail", "mist", "wind"] as const;
export function WeatherParticles({
  frame,
  shelter,
  kind,
  count,
  span,
  center,
  walkMode,
  reducedMotion,
}: {
  frame: WeatherFrame;
  shelter: ReturnType<typeof createWeatherShelter>;
  kind: number;
  count: number;
  span: number;
  center: readonly [number, number];
  walkMode: boolean;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => weatherParticleGeometry(count), [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      kind: { value: kind },
      amount: { value: 0 },
      particleScale: { value: 1 },
      top: { value: shelter.maxHeight + 8 },
      span: { value: span },
      center: { value: new Vector2(...center) },
      wind: { value: new Vector2() },
      daylight: { value: 1 },
      shelter: { value: shelter.texture },
      shelterBounds: { value: shelter.bounds },
    }),
    [kind, shelter, span, center],
  );
  useFrame(({ camera }) => {
    const amount = frame.appearance[keys[kind]];
    if (mesh.current) mesh.current.visible = amount > 0.005 && !reducedMotion;
    // R3F copies uniform wrappers when applying props. Update the material's
    // live uniforms, not the initial prop objects whose scalar values go stale.
    const live = material.current?.uniforms as typeof uniforms | undefined;
    if (!live) return;
    live.particleScale.value = walkMode || kind > 2 ? 1 : kind === 0 ? 1.5 : 2.3;
    live.time.value = frame.time;
    live.amount.value = amount;
    live.daylight.value = frame.daylight;
    live.wind.value.set(frame.appearance.windX, frame.appearance.windZ);
    live.center.value.set(
      walkMode ? camera.position.x : center[0],
      walkMode ? camera.position.z : center[1],
    );
  });
  return (
    <mesh
      ref={mesh}
      name={`weather-${keys[kind]}`}
      geometry={geometry}
      frustumCulled={false}
      raycast={() => {}}
      renderOrder={kind === 3 ? 4 : 5}
    >
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={weatherParticleVertex}
        fragmentShader={weatherParticleFragment}
      />
    </mesh>
  );
}

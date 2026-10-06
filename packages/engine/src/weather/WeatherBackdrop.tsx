import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, ShaderMaterial } from "three";
import type { WeatherFrame } from "./WeatherScene";
import { weatherBackdropFragment } from "./weather-backdrop-shader";

/** Distant atmosphere at far depth: never overlays architecture or indoor views. */
export function WeatherBackdrop({
  frame,
  reducedMotion,
}: {
  frame: WeatherFrame;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      daylight: { value: 1 },
      darkness: { value: 0 },
      coverage: { value: 0 },
      mist: { value: 0 },
      rain: { value: 0 },
      aspect: { value: 1 },
    }),
    [],
  );
  useFrame(({ size }) => {
    const live = material.current?.uniforms as typeof uniforms | undefined;
    if (!live || !mesh.current) return;
    const weather = frame.appearance;
    mesh.current.visible = weather.clouds + weather.mist > 0.005;
    live.time.value = frame.time;
    live.daylight.value = frame.daylight;
    live.darkness.value = weather.darkness;
    live.coverage.value = weather.clouds;
    live.mist.value = weather.mist;
    live.rain.value = reducedMotion ? 0 : weather.rain;
    live.aspect.value = size.width / Math.max(1, size.height);
  }, -0.5);
  return (
    <mesh
      ref={mesh}
      name="weather-backdrop"
      frustumCulled={false}
      renderOrder={-900}
      raycast={() => {}}
    >
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying vec2 backdropUv;
        void main() { backdropUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }`}
        fragmentShader={weatherBackdropFragment}
      />
    </mesh>
  );
}

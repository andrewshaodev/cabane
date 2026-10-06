import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  SphereGeometry,
  Vector3,
  type Mesh,
  type MeshToonMaterial,
} from "three";
import { ToonMaterial } from "../rendering";
import { weatherRandom } from "./weather-particle-geometry";
import type { WeatherFrame } from "./WeatherScene";

export function WeatherClouds({
  frame,
  center,
  radius,
  top,
  detail,
  walkMode,
  reducedMotion,
}: {
  frame: WeatherFrame;
  center: readonly [number, number];
  radius: number;
  top: number;
  detail: boolean;
  walkMode: boolean;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshToonMaterial>(null);
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(1, detail ? 16 : 10, detail ? 10 : 7);
    const result = new InstancedBufferGeometry();
    result.index = sphere.index;
    result.attributes = sphere.attributes;
    const offsets: number[] = [],
      seeds: number[] = [];
    for (let cluster = 0; cluster < 16; cluster++) {
      const angle = (cluster / 16) * Math.PI * 2;
      const distance = radius * (0.8 + weatherRandom(cluster, 7) * 0.5);
      for (let lobe = 0; lobe < 6; lobe++) {
        const index = cluster * 6 + lobe;
        const size = 1.0 + weatherRandom(index, 4) * 1.5;
        offsets.push(
          center[0] + Math.sin(angle) * distance + (weatherRandom(index, 2) - 0.5) * 4,
          top + weatherRandom(cluster, 3) * 3 + weatherRandom(index, 1) * 0.8,
          center[1] + Math.cos(angle) * distance + (weatherRandom(index, 3) - 0.5) * 3,
          size,
        );
        seeds.push(weatherRandom(cluster, 8));
      }
    }
    result.instanceCount = offsets.length / 4;
    result.setAttribute("cloudOffset", new InstancedBufferAttribute(new Float32Array(offsets), 4));
    result.setAttribute("cloudSeed", new InstancedBufferAttribute(new Float32Array(seeds), 1));
    return result;
  }, [center, radius, top, detail]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      weatherTime: { value: 0 },
      weatherClouds: { value: 0 },
      weatherWind: { value: new Vector3() },
      weatherFocus: { value: new Vector3(center[0], 1.5, center[1]) },
      weatherWalk: { value: 0 },
    }),
    [center],
  );
  const light = useMemo(() => new Color("#f2f1e7"), []);
  const dark = useMemo(() => new Color("#6f839a"), []);
  useFrame(() => {
    if (mesh.current) mesh.current.visible = frame.appearance.clouds > 0.005;
    uniforms.weatherTime.value = frame.time;
    uniforms.weatherClouds.value = frame.appearance.clouds;
    uniforms.weatherWind.value.set(frame.appearance.windX, 0, frame.appearance.windZ);
    uniforms.weatherWalk.value = walkMode ? 1 : 0;
    if (material.current) {
      material.current.color.copy(light).lerp(dark, frame.appearance.darkness);
      // Slow interior glow; one pulse every 29 seconds, never a full-scene flash.
      const pulse = Math.max(0, Math.sin((((frame.time % 29) - 1) * Math.PI) / 3));
      material.current.emissive.set("#8199b6");
      material.current.emissiveIntensity =
        !reducedMotion && frame.time % 29 < 4 ? pulse * frame.appearance.storm * 0.1 : 0;
    }
  });
  return (
    <mesh
      ref={mesh}
      name="weather-clouds"
      geometry={geometry}
      frustumCulled={false}
      raycast={() => {}}
    >
      <ToonMaterial
        color="#f2f1e7"
        alphaHash
        depthWrite
        opacity={1}
        onUpdate={(value) => {
          material.current = value;
        }}
        onBeforeCompile={(shader) => {
          Object.assign(shader.uniforms, uniforms);
          shader.vertexShader = `attribute vec4 cloudOffset; attribute float cloudSeed; uniform float weatherTime; uniform float weatherClouds; uniform vec3 weatherWind; uniform vec3 weatherFocus; uniform float weatherWalk; varying float cloudAlpha;\n${shader.vertexShader}`;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `
          vec3 transformed = position * cloudOffset.w * vec3(1.5, 0.72, 1.0) + cloudOffset.xyz;
          transformed.xz += sin(weatherTime * 0.12 + cloudSeed * 6.28) * weatherWind.xz * 4.0;
          cloudAlpha = smoothstep(cloudSeed - 0.15, cloudSeed + 0.2, weatherClouds);
          vec3 ray = normalize(weatherFocus - cameraPosition);
          vec3 toCloud = transformed - cameraPosition;
          float along = dot(toCloud, ray);
          float clearance = length(toCloud - ray * along);
          if (weatherWalk < 0.5 && along > 0.0 && along < distance(cameraPosition, weatherFocus)) cloudAlpha *= smoothstep(3.0, 9.0, clearance);
          cloudAlpha *= smoothstep(1.5, 5.0, length(toCloud));
        `,
          );
          shader.fragmentShader = `varying float cloudAlpha;\n${shader.fragmentShader}`;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <alphatest_fragment>",
            "diffuseColor.a *= cloudAlpha; if (diffuseColor.a < 0.01) discard;\n#include <alphatest_fragment>",
          );
        }}
        customProgramCacheKey={() => "cabane-weather-clouds-v1"}
      />
    </mesh>
  );
}

import { Suspense, useMemo, useRef } from "react";
import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  Matrix4,
  Vector3,
  MathUtils,
  type Group,
  type InstancedMesh,
  type MeshLambertMaterial,
} from "three";
import { WeatherCloudAssetBoundary } from "./WeatherCloudAssetBoundary";
import { weatherRandom } from "./weather-particle-geometry";
import type { WeatherFrame } from "./WeatherScene";

// Pin the same asset used by Drei rather than following a mutable CDN default.
const CLOUD_TEXTURE =
  "https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png";
type Props = {
  frame: WeatherFrame;
  center: readonly [number, number];
  radius: number;
  top: number;
  detail: boolean;
  walkMode: boolean;
  reducedMotion: boolean;
};

function CloudField({ frame, center, radius, top, detail, walkMode, reducedMotion }: Props) {
  const field = useRef<Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const size = 0.6 + weatherRandom(index, 4) ** 2 * 1.35;
        return {
          seed: index + 71,
          position: [
            center[0] + (weatherRandom(index, 19) * 2 - 1) * radius * 1.15,
            top + weatherRandom(index, 3) * 5 - 1.5,
            center[1] + (weatherRandom(index, 23) * 2 - 1) * radius * 1.15,
          ] as [number, number, number],
          volume: 7 * size,
          bounds: [
            4.5 * size,
            0.7 + weatherRandom(index, 11) * 1.5,
            1.5 + weatherRandom(index, 12) * 2,
          ] as [number, number, number],
          segments: Math.round((detail ? 16 : 10) * (0.7 + size * 0.5)),
        };
      }),
    [center, radius, top, detail],
  );
  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      point: new Vector3(),
      ray: new Vector3(),
      offset: new Vector3(),
      focus: new Vector3(center[0], 1.5, center[1]),
      cream: new Color("#fff7e9"),
      slate: new Color("#718197"),
    }),
    [center],
  );
  // Drei updates and depth-sorts its billboards at priority 0. Apply our
  // appearance afterward, before the scene's contour/composite pass at 1.
  useFrame(({ camera }) => {
    const group = field.current;
    if (!group) return;
    group.visible = frame.appearance.clouds > 0.005;
    const mesh = group.children.find((child) => (child as InstancedMesh).isInstancedMesh) as
      InstancedMesh | undefined;
    if (!mesh) return;
    mesh.name = "weather-clouds";
    mesh.visible = group.visible;
    const material = mesh.material as MeshLambertMaterial;
    material.color
      .copy(scratch.cream)
      .lerp(scratch.slate, MathUtils.smoothstep(frame.appearance.darkness, 0.05, 0.8));
    material.color.multiplyScalar(MathUtils.lerp(0.48, 1, frame.daylight));
    const pulse = Math.max(0, Math.sin((((frame.time % 29) - 1) * Math.PI) / 3));
    material.emissive.set("#8199b6");
    material.emissiveIntensity =
      frame.daylight * (0.12 - frame.appearance.darkness * 0.12) +
      (!reducedMotion && frame.time % 29 < 4 ? pulse * frame.appearance.storm * 0.1 : 0);
    scratch.ray.copy(scratch.focus).sub(camera.position).normalize();
    const opacity = mesh.geometry.getAttribute("cloudOpacity");
    for (let index = 0; index < mesh.count; index++) {
      mesh.getMatrixAt(index, scratch.matrix);
      scratch.point.setFromMatrixPosition(scratch.matrix).applyMatrix4(mesh.matrixWorld);
      scratch.offset.copy(scratch.point).sub(camera.position);
      const along = scratch.offset.dot(scratch.ray);
      const clearance = scratch.offset.addScaledVector(scratch.ray, -along).length();
      const angle = Math.atan2(scratch.point.x - center[0], scratch.point.z - center[1]);
      const threshold = (Math.sin(angle * 3 + 1) + 1) * 0.3;
      let alpha = MathUtils.smoothstep(frame.appearance.clouds, threshold, threshold + 0.35);
      if (!walkMode && along > 0 && along < camera.position.distanceTo(scratch.focus))
        alpha *= MathUtils.smoothstep(clearance, 3, 10);
      opacity.setX(index, opacity.getX(index) * alpha * 0.75);
    }
    opacity.needsUpdate = true;
  }, 0.5);
  useFrame(() => {
    if (!field.current) return;
    const drift = Math.sin(frame.time * 0.08) * 3;
    field.current.position.set(drift * frame.appearance.windX, 0, drift * frame.appearance.windZ);
    field.current.updateMatrixWorld(true);
  }, -1.5);
  return (
    <Clouds
      ref={field}
      name="weather-cloud-field"
      texture={CLOUD_TEXTURE}
      limit={detail ? 280 : 180}
      frustumCulled={false}
    >
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.seed}
          {...cloud}
          smallestVolume={0.45}
          concentrate="inside"
          growth={0}
          speed={0}
          fade={8}
          opacity={1}
        />
      ))}
    </Clouds>
  );
}

export function WeatherClouds(props: Props) {
  return (
    <WeatherCloudAssetBoundary>
      <Suspense fallback={null}>
        <CloudField {...props} />
      </Suspense>
    </WeatherCloudAssetBoundary>
  );
}

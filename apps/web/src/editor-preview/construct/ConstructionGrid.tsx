import { FLOOR_EDITOR_GRID_METERS } from "@cabane/engine";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/** World metres match the snapping origin. The mesh never participates in picking. */
export function ConstructionGrid() {
  const mesh = useRef<Mesh>(null);
  const uniforms = useMemo(() => ({ cellSize: { value: FLOOR_EDITOR_GRID_METERS } }), []);
  useFrame(({ camera }) => {
    if (mesh.current) mesh.current.position.set(camera.position.x, -.04, camera.position.z);
  });
  return <mesh ref={mesh} name="construction-grid" rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}} renderOrder={-100}>
    <planeGeometry args={[20000, 20000]} />
    <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
      vertexShader={`varying vec2 worldPoint;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          worldPoint = world.xz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`}
      fragmentShader={`varying vec2 worldPoint;
        uniform float cellSize;
        float line(vec2 point, float spacing) {
          vec2 p = point / spacing;
          vec2 width = max(fwidth(p), vec2(0.00001));
          vec2 distanceToLine = abs(fract(p - 0.5) - 0.5) / width;
          return 1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0);
        }
        void main() {
          float metersPerPixel = max(fwidth(worldPoint.x), fwidth(worldPoint.y));
          float fineVisibility = (1.0 - smoothstep(0.008, 0.025, metersPerPixel));
          float majorVisibility = 1.0 - smoothstep(0.15, 0.4, metersPerPixel);
          float alpha = max(line(worldPoint, cellSize) * 0.09 * fineVisibility,
            line(worldPoint, 1.0) * 0.19 * majorVisibility);
          gl_FragColor = vec4(0.48, 0.48, 0.42, alpha);
        }`} />
  </mesh>;
}

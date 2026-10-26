import { Component, type ReactNode, memo, Suspense, useMemo, useLayoutEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  Matrix4,
  Object3D,
  Vector3,
  DoubleSide,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
  type BufferGeometry,
} from "three";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { ToonMaterial } from "../rendering";

class SceneryAssetBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

const assets = {
  grass: new URL("./assets/grass.glb", import.meta.url).href,
  tree: new URL("./assets/tree.glb", import.meta.url).href,
  bush: new URL("./assets/bush.glb", import.meta.url).href,
  flowers: new URL("./assets/flowers.glb", import.meta.url).href,
  pine: new URL("./assets/pine.glb", import.meta.url).href,
  fern: new URL("./assets/fern.glb", import.meta.url).href,
};
type Placement = { x: number; z: number; scale: number; angle: number };
function ModelPart({
  geometry,
  material,
  placements,
  heightScale = 1,
}: {
  heightScale?: number;
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  placements: Placement[];
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const object = new Object3D();
    placements.forEach((p, i) => {
      object.position.set(p.x, 0, p.z);
      object.rotation.set(0, p.angle, 0);
      object.scale.set(p.scale, p.scale * heightScale, p.scale);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, heightScale]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, placements.length]}
      castShadow
      receiveShadow
      dispose={null}
    >
      <ToonMaterial
        color={material.color}
        map={material.map}
        alphaTest={material.transparent ? 0.45 : 0}
        side={DoubleSide}
      />
    </instancedMesh>
  );
}
function Plants({ kind, placements }: { kind: keyof typeof assets; placements: Placement[] }) {
  const { scene } = useGLTF(assets[kind]);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(scene),
      size = bounds.getSize(new Vector3()),
      center = bounds.getCenter(new Vector3());
    // Normalize by horizontal spread: keep authored grass blades, branches, and leaf cards intact.
    const scale = 1 / Math.max(size.x, size.z, 0.001);
    const normalize = new Matrix4()
      .makeScale(scale, scale, scale)
      .multiply(new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
    const result: { geometry: BufferGeometry; material: MeshStandardMaterial }[] = [];
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      result.push({
        geometry: mesh.geometry
          .clone()
          .applyMatrix4(new Matrix4().multiplyMatrices(normalize, mesh.matrixWorld)),
        material: mesh.material as MeshStandardMaterial,
      });
    });
    return result;
  }, [scene]);
  useLayoutEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);
  return (
    <group name={`diorama-${kind}`}>
      {parts.map((p, i) => (
        <ModelPart
          key={i}
          {...p}
          placements={placements}
          heightScale={kind === "grass" ? 0.32 : 1}
        />
      ))}
    </group>
  );
}

export const DioramaScenery = memo(function DioramaScenery({
  landscape,
  centerX,
  centerZ,
  width,
  depth,
}: {
  landscape: "grass" | "mountain";
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}) {
  const placements = useMemo(() => {
    let seed = 781;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const perimeter = 2 * (width + depth);
    const scatter = (count: number, min: number, spread: number, diameter: number) =>
      Array.from({ length: count }, () => {
        const t = random() * perimeter,
          inset = min + random() * spread;
        let x, z;
        if (t < width) {
          x = -width / 2 + 0.7 + random() * (width - 1.4);
          z = -depth / 2 + inset;
        } else if (t < width + depth) {
          x = width / 2 - inset;
          z = -depth / 2 + 0.7 + random() * (depth - 1.4);
        } else if (t < 2 * width + depth) {
          x = -width / 2 + 0.7 + random() * (width - 1.4);
          z = depth / 2 - inset;
        } else {
          x = -width / 2 + inset;
          z = -depth / 2 + 0.7 + random() * (depth - 1.4);
        }
        return { x, z, scale: diameter * (0.7 + random() * 0.3), angle: random() * Math.PI * 2 };
      });
    return {
      grass: scatter(Math.min(9000, Math.floor(perimeter * 65)), 0.25, 2.65, 0.48),
      tree: scatter(Math.min(22, Math.floor(perimeter / 4)), 1.25, 0.45, 1.65),
      bush: scatter(Math.min(80, Math.floor(perimeter)), 0.8, 1.4, 0.8),
      flowers: scatter(Math.min(150, Math.floor(perimeter * 2)), 0.6, 1.9, 0.45),
      fern: scatter(Math.min(65, Math.floor(perimeter * 0.7)), 0.8, 1.4, 0.65),
    };
  }, [width, depth]);
  return (
    <group
      name={`diorama-${landscape}-scenery`}
      position={[centerX, GROUND_ELEVATION_METERS, centerZ]}
    >
      <SceneryAssetBoundary key={landscape}>
        <Suspense fallback={null}>
          <Plants kind="grass" placements={placements.grass} />
          <Plants kind={landscape === "mountain" ? "pine" : "tree"} placements={placements.tree} />
          <Plants kind="bush" placements={placements.bush} />
          <Plants kind="flowers" placements={placements.flowers} />
          <Plants kind="fern" placements={placements.fern} />
        </Suspense>
      </SceneryAssetBoundary>
    </group>
  );
});

import { useMemo } from "react";
import { CylinderGeometry, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial } from "@cabane/engine";
/** Circular grille and static blades; the radial bars meet the hub and rim. */
export function CompactFanHead() {
  const bars = useMemo(() => {
    const parts = Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8,
        end = new Vector3(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0),
        q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().normalize());
      return new CylinderGeometry(0.0012, 0.0012, 0.13, 6).applyMatrix4(
        new Matrix4().compose(end.clone().multiplyScalar(0.5), q, new Vector3(1, 1, 1)),
      );
    });
    const geometry = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    return geometry;
  }, []);
  return (
    <group position={[0, 0.165, 0]}>
      <mesh name="fan-head-case" rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.015]}>
        <cylinderGeometry args={[0.125, 0.125, 0.055, 32]} />
        <ToonMaterial color="#303536" />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.042, Math.cos(a) * 0.042, 0.015]}
            rotation={[0, 0, -a]}
            scale={[0.028, 0.074, 0.003]}
          >
            <sphereGeometry args={[1, 12, 8]} />
            <ToonMaterial color="#596264" />
          </mesh>
        );
      })}
      <mesh name="grille-rim" position={[0, 0, 0.028]}>
        <torusGeometry args={[0.13, 0.005, 6, 32]} />
        <ToonMaterial color="#353c3d" />
      </mesh>
      <mesh name="grille-bars" geometry={bars} position={[0, 0, 0.028]}>
        <ToonMaterial color="#22292a" />
      </mesh>
      <mesh position={[0, 0, 0.031]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.006, 16]} />
        <ToonMaterial color="#3b4445" />
      </mesh>
    </group>
  );
}

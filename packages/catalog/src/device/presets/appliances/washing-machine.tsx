import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

export function WashingMachineModel({
  visualState,
}: HomeDeviceModelProps) {
  return (
    <group name="catalog-washing-machine" userData={{ walkCollider: true }}>
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.86, 0.58]} />
        <ToonMaterial color="#e8e7e2" />
        <Outlines color="#777b78" thickness={0.006} />
      </mesh>
      <mesh position={[0, 0.35, 0.302]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.05, 28]} />
        <ToonMaterial color="#202827" />
        <Outlines color="#111716" thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.35, 0.329]}>
        <circleGeometry args={[0.175, 24]} />
        <ToonMaterial color="#789091" transparent opacity={0.72} />
      </mesh>
      <mesh position={[-0.19, 0.72, 0.299]}>
        <boxGeometry args={[0.17, 0.08, 0.018]} />
        <ToonMaterial color="#d0d2ce" />
      </mesh>
      <mesh position={[0.05, 0.72, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.025, 16]} />
        <ToonMaterial color="#303837" />
      </mesh>
      <mesh position={[0.205, 0.72, 0.305]}>
        <boxGeometry args={[0.15, 0.075, 0.02]} />
        <ToonMaterial color="#283231" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.255, 0.755, 0.314]} scale={0.7} />
      <mesh position={[0.23, 0.09, 0.301]}>
        <boxGeometry args={[0.11, 0.13, 0.018]} />
        <ToonMaterial color="#deded9" />
      </mesh>
    </group>
  );
}

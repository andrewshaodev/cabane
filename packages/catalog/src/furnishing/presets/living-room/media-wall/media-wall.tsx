import { PampasVase } from "../../decor";
import { Outlines, ToonMaterial } from "@cabane/engine";
import { CabinetBox } from "./cabinet-box";
import { CabinetJoint } from "./cabinet-joint";

export function MediaWall() {
  return (
    <group name="mur-tv-salon-custom" userData={{ walkCollider: true }}>
      <CabinetBox size={[2.25, 0.4, 0.38]} position={[0, 0.2, 0]} color="#eeeae1" />
      <mesh position={[0, 0.2, -0.201]} receiveShadow>
        <boxGeometry args={[2.18, 0.34, 0.018]} />
        <ToonMaterial color="#f7f4ed" />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <CabinetJoint key={x} size={[0.006, 0.32, 0.008]} position={[x, 0.2, -0.214]} />
      ))}
      <CabinetJoint size={[2.18, 0.006, 0.008]} position={[0, 0.2, -0.214]} />
      <CabinetBox
        size={[2.31, 0.065, 0.43]}
        position={[0, 0.4325, 0]}
        color="#f4f0e8"
        outlineThickness={0.007}
      />
      <group position={[-1.65, 0, 0]}>
        <CabinetBox size={[1.05, 0.72, 0.38]} position={[0, 0.36, 0]} color="#eeeae1" />
        <mesh position={[0, 0.36, -0.201]} receiveShadow>
          <boxGeometry args={[0.99, 0.66, 0.018]} />
          <ToonMaterial color="#f7f4ed" />
        </mesh>
        <CabinetJoint size={[0.006, 0.64, 0.008]} position={[0, 0.36, -0.214]} />
        <CabinetJoint size={[0.98, 0.006, 0.008]} position={[0, 0.36, -0.214]} />
        <CabinetBox
          size={[1.09, 0.06, 0.42]}
          position={[0, 0.75, 0]}
          color="#f4f0e8"
          outlineThickness={0.006}
        />
        <mesh castShadow position={[0.22, 0.89, -0.04]}>
          <cylinderGeometry args={[0.08, 0.1, 0.22, 12]} />
          <ToonMaterial color="#d6c0a2" />
          <Outlines color="#75644f" thickness={0.005} screenspace={false} />
        </mesh>
      </group>
      <group position={[0.92, 0.465, -0.08]}>
        <PampasVase />
      </group>
    </group>
  );
}

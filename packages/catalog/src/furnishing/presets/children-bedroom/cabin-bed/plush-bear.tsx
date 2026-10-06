import { Outlines, ToonMaterial } from "@cabane/engine";

export function PlushBear() {
  return (
    <group position={[-0.23, 0.48, 0.76]} rotation={[0.04, 0.25, 0]}>
      <mesh castShadow position={[0, 0.12, 0]} scale={[0.13, 0.15, 0.1]}>
        <sphereGeometry args={[1, 18, 12]} />
        <ToonMaterial color="#a9785d" />
        <Outlines thickness={0.005} color="#553d31" screenspace={false} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]} scale={[0.105, 0.1, 0.09]}>
        <sphereGeometry args={[1, 18, 12]} />
        <ToonMaterial color="#b48367" />
        <Outlines thickness={0.005} color="#553d31" screenspace={false} />
      </mesh>
      {[-0.076, 0.076].map((earX) => (
        <mesh key={earX} castShadow position={[earX, 0.365, 0]}>
          <sphereGeometry args={[0.042, 12, 8]} />
          <ToonMaterial color="#986b52" />
        </mesh>
      ))}
      <mesh position={[0, 0.283, -0.083]} scale={[0.045, 0.032, 0.018]}>
        <sphereGeometry args={[1, 12, 8]} />
        <ToonMaterial color="#e1b89b" />
      </mesh>
      {[-0.035, 0.035].map((eyeX) => (
        <mesh key={eyeX} position={[eyeX, 0.32, -0.085]}>
          <sphereGeometry args={[0.009, 8, 6]} />
          <ToonMaterial color="#3f322b" />
        </mesh>
      ))}
    </group>
  );
}

// Opaque cloth avoids alpha-hash shimmer; roof strips have 5 mm seam gaps.

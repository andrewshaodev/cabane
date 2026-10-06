import { BlasterFinish } from "./BlasterFinish";

export function BlasterReactor({ side }: { side: number }) {
  return (
    <group
      name="blaster-side-reactor"
      position={[side * 0.103, 0.035, 0.125]}
      rotation={[0, (side * Math.PI) / 2, 0]}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.022, 40]} />
        <BlasterFinish kind="chassis" />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <torusGeometry args={[0.047, 0.012, 12, 40]} />
        <BlasterFinish kind="trim" />
      </mesh>
      <mesh position={[0, 0, 0.01]} scale={[1, 1, 0.48]}>
        <sphereGeometry args={[0.037, 32, 16]} />
        <BlasterFinish kind="energy" />
      </mesh>
      <mesh position={[-0.011, 0.014, 0.027]} scale={[1, 0.65, 0.35]}>
        <sphereGeometry args={[0.009, 16, 8]} />
        <BlasterFinish kind="glint" />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <torusGeometry args={[0.036, 0.0035, 8, 32]} />
        <BlasterFinish kind="energy" />
      </mesh>
    </group>
  );
}

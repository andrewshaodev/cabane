import { Outlines, ToonMaterial } from "@cabane/engine";

export function WickerHamper() {
  return (
    <group name="wicker-hamper">
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.56, 0.42]} />
        <ToonMaterial color="#a9784f" />
        <Outlines color="#604431" thickness={0.006} />
      </mesh>
      {[0.1, 0.18, 0.26, 0.34, 0.42, 0.5].map((y) => (
        <group key={y}>
          <mesh position={[-0.224, y, 0]}>
            <boxGeometry args={[0.012, 0.025, 0.39]} />
            <ToonMaterial color="#704b34" />
          </mesh>
          <mesh position={[0, y, -0.214]}>
            <boxGeometry args={[0.41, 0.025, 0.012]} />
            <ToonMaterial color="#704b34" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.575, 0]} castShadow>
        <boxGeometry args={[0.48, 0.035, 0.46]} />
        <ToonMaterial color="#b98a61" />
        <Outlines color="#604431" thickness={0.004} />
      </mesh>
    </group>
  );
}

import { Outlines, ToonMaterial } from "@cabane/engine";
import { RoundedSuitePanel } from "../construction/rounded-suite-panel";

export function ShowerColumn() {
  const metal = "#4c4d4b";
  const metalLight = "#747875";
  const edge = "#262725";
  return (
    <group name="wall-mounted-rain-shower-column">
      <mesh position={[-.055, 1.64, 0]} castShadow>
        <cylinderGeometry args={[.018, .018, 1.28, 12]} />
        <ToonMaterial color={metalLight} />
        <Outlines thickness={0.004} color={edge} screenspace={false} />
      </mesh>
      {[1.28, 1.98].map((height) => (
        <mesh
          key={height}
          position={[-.0175, height, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[.014, .014, .075, 10]} />
          <ToonMaterial color={metalLight} />
        </mesh>
      ))}
      <RoundedSuitePanel
        size={[0.11, 0.105, 0.46]}
        position={[-0.09, 1.03, 0]}
        color={metal}
        outline={edge}
      />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[-0.095, 1.03, side * 0.2]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.055, 0.055, 0.055, 12]} />
          <ToonMaterial color={metalLight} />
        </mesh>
      ))}
      <mesh position={[-.25, 2.282, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.4, 12]} />
        <ToonMaterial color={metalLight} />
      </mesh>
      <mesh position={[-.45, 2.245, 0]} scale={[1, 1, 0.78]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.045, 20]} />
        <ToonMaterial color={metal} />
        <Outlines thickness={0.005} color={edge} screenspace={false} />
      </mesh>
      <group position={[-0.17, 1.62, 0.1]} rotation={[0, 0, -0.24]}>
        <RoundedSuitePanel
          size={[0.065, 0.3, 0.075]}
          position={[0, -0.09, 0]}
          color={metalLight}
          outline={edge}
        />
        <RoundedSuitePanel
          size={[0.11, 0.17, 0.15]}
          position={[0, 0.12, 0]}
          color={metal}
          outline={edge}
        />
      </group>
    </group>
  );
}

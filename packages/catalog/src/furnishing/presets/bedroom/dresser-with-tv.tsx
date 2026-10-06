import { ToonMaterial } from "@cabane/engine";
import { RoundedSuitePanel } from "../construction/rounded-suite-panel";

export function DresserWithTv() {
  const wood = "#b78a5d";
  const woodLight = "#c79a69";
  const woodShade = "#936942";
  const woodOutline = "#5f432f";
  const hardware = "#242526";
  return (
    <group name="commode-pin-et-television-parentale-custom" userData={{ walkCollider: true }}>
      <RoundedSuitePanel
        size={[1.05, 0.72, 0.49]}
        position={[0, 0.42, 0]}
        color={wood}
        outline={woodOutline}
      />
      {[-1, 1].map((side) => (
        <RoundedSuitePanel
          key={side}
          size={[0.095, 0.82, 0.52]}
          position={[side * (1.24 / 2 - 0.0475), 0.41, 0]}
          color={woodLight}
          outline={woodOutline}
        />
      ))}
      <RoundedSuitePanel
        size={[1.32, 0.11, 0.55]}
        position={[0, 0.805, 0]}
        color={woodLight}
        outline={woodOutline}
      />
      {[0.25, 0.59].map((drawerY) => (
        <group key={drawerY} position={[0, drawerY, 0.257]}>
          <RoundedSuitePanel
            size={[1.1, 0.285, 0.035]}
            position={[0, 0, 0]}
            color={woodLight}
            outline={woodOutline}
          />
          <RoundedSuitePanel
            size={[0.48, 0.035, 0.035]}
            position={[0, 0.055, 0.045]}
            color={hardware}
            outline="#111213"
          />
        </group>
      ))}
      {[-0.48, 0.48].map((x) => (
        <RoundedSuitePanel
          key={x}
          size={[0.16, 0.08, 0.39]}
          position={[x, 0.04, -0.015]}
          color={woodShade}
          outline={woodOutline}
        />
      ))}
      <group name="television-parentale-custom" position={[0, 0.86, 0.035]}>
        <RoundedSuitePanel
          size={[0.48, 0.035, 0.2]}
          position={[0, 0.0175, 0]}
          color={hardware}
          outline="#0f1113"
        />
        <RoundedSuitePanel
          size={[0.075, 0.17, 0.075]}
          position={[0, 0.105, 0]}
          color="#303235"
          outline="#0f1113"
        />
        <RoundedSuitePanel
          size={[0.9, 0.54, 0.055]}
          position={[0, 0.39, 0]}
          color="#1b1d20"
          outline="#090a0c"
        />
        <RoundedSuitePanel
          size={[0.842, 0.476, 0.006]}
          position={[0, 0.4, 0.0325]}
          color="#17232d"
          outline="#0b1117"
        />
      </group>
      <mesh position={[0, 0.985, 0.0765]}>
        <boxGeometry args={[0.075, 0.018, 0.008]} />
        <ToonMaterial color="#aeb4b7" />
      </mesh>
    </group>
  );
}

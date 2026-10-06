import { Outlines, ToonMaterial } from "@cabane/engine";
import { RoundedSuitePanel } from "../construction/rounded-suite-panel";

export function WideShowerTray() {
  return (
    <group name="receveur-douche-suite-parentale-custom" userData={{ walkCollider: true }}>
      <RoundedSuitePanel
        size={[2, 0.045, 0.89]}
        position={[0, 0.0225, 0]}
        color="#f1f2ef"
        outline="#aeb5b2"
      />
      <RoundedSuitePanel
        size={[0.13, 0.018, 0.13]}
        position={[-0.72, 0.054, 0.24]}
        color="#909895"
        outline="#606865"
      />
    </group>
  );
}

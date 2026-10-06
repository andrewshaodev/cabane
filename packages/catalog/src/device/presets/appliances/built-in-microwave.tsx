import { ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction";
import { AppliancePull } from "./appliance-pull";
/** Fixed built-in microwave, with a projecting face and independent cabinet. */
export function BuiltInMicrowaveModel(_props: HomeDeviceModelProps) {
  return (
    <group name="catalog-built-in-microwave" userData={{ walkCollider: true }}>
      <mesh
        name="microwave-built-in-housing"
        position={[0, 0.185, -0.036]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.56, 0.37, 0.278]} />
        <ToonMaterial color="#727a77" />
      </mesh>
      <RoundedFurniturePanel
        name="microwave-built-in-frame"
        size={[0.6, 0.39, 0.022]}
        position={[0, 0.195, 0.114]}
        color="#b7bdbb"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="microwave-built-in-glass"
        size={[0.552, 0.276, 0.008]}
        position={[0, 0.15, 0.129]}
        color="#293434"
        radius={0.004}
        outlineColor="#515e5a"
      />
      <RoundedFurniturePanel
        name="microwave-built-in-window"
        size={[0.41, 0.17, 0.003]}
        position={[0, 0.139, 0.1345]}
        color="#495e60"
        radius={0.005}
        outline={false}
      />
      <AppliancePull width={0.46} position={[0, 0.265, 0.133]} />
      <RoundedFurniturePanel
        name="microwave-built-in-control-panel"
        size={[0.552, 0.075, 0.008]}
        position={[0, 0.338, 0.129]}
        color="#293434"
        radius={0.002}
        outline={false}
      />
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.338, 0.144]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.022, 12]} />
          <ToonMaterial color="#b7bdbb" />
        </mesh>
      ))}
      <mesh name="microwave-built-in-display" position={[0, 0.338, 0.1345]}>
        <boxGeometry args={[0.06, 0.025, 0.003]} />
        <ToonMaterial color="#546863" />
      </mesh>
    </group>
  );
}

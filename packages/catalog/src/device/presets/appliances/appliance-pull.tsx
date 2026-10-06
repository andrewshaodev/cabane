import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";

/** A horizontal pull with two brackets touching the door surface. */
export function AppliancePull({
  width,
  position,
}: {
  width: number;
  position: [number, number, number];
}) {
  return (
    <group name="appliance-door-pull" position={position}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.025), 0, 0.013]} castShadow>
          <boxGeometry args={[0.022, 0.022, 0.026]} />
          <ToonMaterial color="#9ca4a4" />
        </mesh>
      ))}
      <RoundedFurniturePanel
        size={[width, 0.026, 0.026]}
        position={[0, 0, 0.029]}
        radius={0.006}
        color="#c2c8c7"
        outlineColor="#596360"
      />
    </group>
  );
}

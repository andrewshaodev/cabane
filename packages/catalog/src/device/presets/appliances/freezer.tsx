import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic upright freezer; front faces +Z and the complete cabinet touches Y=0. */
export function FreezerModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-freezer" userData={{ walkCollider: true }}>
      {/* Reserve the front of the bounds for separate door and trim surfaces. */}
      <RoundedFurniturePanel
        size={[0.65, 1.75, 0.656]}
        position={[0, 0.875, -0.012]}
        color="#dfe3df"
        radius={0.025}
        outlineColor="#52605b"
      />
      <RoundedFurniturePanel
        name="freezer-door"
        size={[0.62, 1.68, 0.012]}
        position={[0, 0.875, 0.322]}
        color="#ebede9"
        radius={0.012}
        outline={false}
      />
      {[0.4, 0.75, 1.1, 1.45].map((y) => (
        <mesh key={y} name="freezer-drawer-line" position={[0, y, 0.33]}>
          <boxGeometry args={[0.54, 0.012, 0.002]} />
          <ToonMaterial color="#bdc5c1" />
        </mesh>
      ))}
      <RoundedFurniturePanel
        name="freezer-handle"
        size={[0.026, 0.72, 0.01]}
        position={[0.275, 1.05, 0.335]}
        color="#7b8681"
        radius={0.008}
        outline={false}
      />
      <RoundedFurniturePanel
        name="freezer-display"
        size={[0.13, 0.065, 0.004]}
        position={[0.14, 1.58, 0.332]}
        color="#31413f"
        radius={0.004}
        outline={false}
      />
      <StatusBeacon visualState={visualState} position={[0.185, 1.58, 0.332]} scale={0.28} />
    </group>
  );
}

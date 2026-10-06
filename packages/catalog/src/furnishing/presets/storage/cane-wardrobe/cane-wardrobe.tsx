import { ToonMaterial } from "@cabane/engine";
import { RoundedStoragePanel } from ".././rounded-storage-panel";
import { CaneDoor } from "./cane-door";

export function CaneWardrobe({ width }: { readonly width: number }) {
  const height = 2.15;
  const depth = 0.38;
  const doorWidth = width / 2 - 0.025;
  const frontZ = depth / 2 + 0.02;
  return (
    <group name="placard-cannage-couloir-custom" userData={{ walkCollider: true }}>
      <RoundedStoragePanel
        size={[width - 0.11, height - 0.055, 0.035]}
        position={[0, (height - 0.055) / 2, -depth / 2 + 0.018]}
        color="#ded5ce"
      />
      {[-1, 1].map((side) => (
        <RoundedStoragePanel
          key={side}
          size={[0.055, height, depth]}
          position={[side * (width / 2 - 0.0275), height / 2, 0]}
          color="#e8dfd8"
        />
      ))}
      <RoundedStoragePanel
        size={[width, 0.055, depth]}
        position={[0, height - 0.0275, 0]}
        color="#e8dfd8"
      />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (doorWidth / 2 + 0.0125), 0, 0]}>
          <CaneDoor width={doorWidth} height={height - 0.08} frontZ={frontZ} />
          <mesh
            position={[-side * (doorWidth / 2 - 0.055), 1.02, frontZ + 0.046]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.055, 14]} />
            <ToonMaterial color="#8b765d" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

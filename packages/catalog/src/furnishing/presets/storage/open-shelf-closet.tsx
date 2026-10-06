import { ToonMaterial } from "@cabane/engine";
import { RoundedStoragePanel } from "./rounded-storage-panel";

export function OpenShelfCloset() {
  const width = 0.72;
  const height = 2.15;
  const depth = 0.38;
  const frontZ = depth / 2;
  return (
    <group name="placard-etageres-couloir-custom" userData={{ walkCollider: true }}>
      <RoundedStoragePanel
        size={[width - 0.09, height - 0.01, 0.032]}
        position={[0, height / 2 + 0.005, -depth / 2 + 0.016]}
        color="#e9e5df"
      />
      {[-1, 1].map((side) => (
        <RoundedStoragePanel
          key={side}
          size={[0.045, height, depth]}
          position={[side * (width / 2 - 0.0225), height / 2, 0]}
          color="#eeeae5"
        />
      ))}
      <RoundedStoragePanel
        size={[width - 0.09, 0.64, 0.34]}
        position={[0, 0.32, 0.01]}
        color="#ebe7e1"
      />
      <mesh position={[0, 0.34, frontZ + 0.012]}>
        <boxGeometry args={[0.018, 0.085, 0.022]} />
        <ToonMaterial color="#9c8b78" />
      </mesh>
      {[0.72, 1.08, 1.44, 1.8, 2.12].map((shelfY) => (
        <RoundedStoragePanel
          key={shelfY}
          size={[width - 0.06, 0.035, depth - 0.025]}
          position={[0, shelfY, 0.005]}
          color="#c99f72"
          outline="#806247"
        />
      ))}
    </group>
  );
}

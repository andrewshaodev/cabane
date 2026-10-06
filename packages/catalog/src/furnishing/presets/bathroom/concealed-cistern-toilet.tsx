import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { ConcealedToiletBowl } from "./concealed-toilet-bowl";

/** Wall-hung WC facing +X, retaining the existing wall-contact origin. */
export function ConcealedCisternToilet() {
  return (
    <group name="concealed-cistern-toilet">
      <RoundedFurniturePanel
        name="cistern-enclosure"
        size={[0.21, 1.16, 0.58]}
        position={[0.095, 0.58, 0]}
        color="#e7e3da"
        radius={0.006}
        outlineColor="#aaa69e"
      />
      <RoundedFurniturePanel
        name="dual-flush-plate"
        size={[0.014, 0.14, 0.22]}
        position={[0.205, 0.91, 0]}
        color="#d4d6d3"
        radius={0.005}
        outline={false}
      />
      {/* Button cylinders face out from the enclosure, along +X. */}
      {[
        { z: -0.043, radius: 0.033 },
        { z: 0.047, radius: 0.024 },
      ].map(({ z, radius }) => (
        <mesh
          key={z}
          name="flush-button"
          position={[0.214, 0.91, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius, radius, 0.008, 24]} />
          <ToonMaterial color="#f0f1ed" />
        </mesh>
      ))}
      <RoundedFurniturePanel
        name="bowl-wall-connection"
        size={[0.14, 0.18, 0.28]}
        position={[0.23, 0.31, 0]}
        color="#e9e7e0"
        radius={0.025}
        outline={false}
      />
      <ConcealedToiletBowl />
    </group>
  );
}

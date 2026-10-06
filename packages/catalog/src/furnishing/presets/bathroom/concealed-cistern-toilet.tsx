import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { ConcealedToiletBowl } from "./concealed-toilet-bowl";

/** Wall-hung WC facing +X, retaining the existing wall-contact origin. */
export function ConcealedCisternToilet() {
  return (
    <group name="concealed-cistern-toilet">
      <RoundedFurniturePanel name="cistern-enclosure"
        size={[.21, 1.16, .58]} position={[.095, .58, 0]}
        color="#e7e3da" radius={.006} outlineColor="#aaa69e" />
      <RoundedFurniturePanel name="dual-flush-plate"
        size={[.014, .14, .22]} position={[.205, .91, 0]}
        color="#d4d6d3" radius={.005} outline={false} />
      {/* Button cylinders face out from the enclosure, along +X. */}
      {[{ z: -.043, radius: .033 }, { z: .047, radius: .024 }].map(({ z, radius }) => (
        <mesh key={z} name="flush-button" position={[.214, .91, z]}
          rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius, radius, .008, 24]} />
          <ToonMaterial color="#f0f1ed" />
        </mesh>
      ))}
      <RoundedFurniturePanel name="bowl-wall-connection"
        size={[.14, .18, .28]} position={[.23, .31, 0]}
        color="#e9e7e0" radius={.025} outline={false} />
      <ConcealedToiletBowl />
    </group>
  );
}

import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic condenser dryer; full envelope 60 × 85 × 65 cm (W/H/D). */
export function TumbleDryerModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-tumble-dryer" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.6, .82, .6]} position={[0, .44, -.025]}
      color="#e8e7e2" radius={.009} outlineColor="#777b78" />
    <mesh name="dryer-plinth" position={[0, .015, -.025]} castShadow receiveShadow>
      <boxGeometry args={[.54, .03, .55]} />
      <ToonMaterial color="#596360" />
    </mesh>
    <mesh name="dryer-door-rim" position={[0, .43, .293]} castShadow>
      <torusGeometry args={[.197, .019, 6, 24]} />
      <ToonMaterial color="#c1c8c7" />
      <Outlines color="#697572" thickness={.0015} />
    </mesh>
    <mesh position={[0, .43, .287]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.188, .188, .012, 24]} />
      <ToonMaterial color="#536f74" />
    </mesh>
    <RoundedFurniturePanel name="dryer-door-grip" size={[.028, .1, .02]}
      position={[.194, .43, .315]} radius={.005} color="#303a39" outline={false} />
    <RoundedFurniturePanel size={[.568, .105, .01]} position={[0, .775, .28]}
      color="#d8dbd7" radius={.002} outline={false} />
    <RoundedFurniturePanel name="dryer-condensate-drawer" size={[.18, .067, .012]}
      position={[-.176, .775, .289]} color="#eeeee8" radius={.003} />
    <mesh position={[-.02, .777, .297]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.033, .033, .022, 16]} />
      <ToonMaterial color="#46534f" />
    </mesh>
    <RoundedFurniturePanel size={[.16, .057, .012]} position={[.171, .777, .29]}
      color="#283231" radius={.003} outline={false} />
    <StatusBeacon visualState={visualState} position={[.22, .779, .303]} scale={.5} />
    {[.091, .113, .135].map((y) => <mesh key={y} name="dryer-condenser-vent" position={[0, y, .277]}>
      <boxGeometry args={[.43, .008, .008]} />
      <ToonMaterial color="#7a8580" />
    </mesh>)}
  </group>;
}

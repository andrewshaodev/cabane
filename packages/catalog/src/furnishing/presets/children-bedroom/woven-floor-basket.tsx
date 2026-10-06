import { Vector2 } from "three";
import { Outlines, ToonMaterial } from "@cabane/engine";

const WICKER = "#b78958";
const WICKER_LIGHT = "#d2a66f";
const WICKER_DARK = "#6d4c31";

// Continuous outer wall, rolled rim, inner wall, and recessed floor. No lid.
const BASKET_PROFILE = [
  [0, 0], [.34, 0], [.29, .48], [.305, .495], [.305, .505],
  [.298, .512], [.28, .512], [.273, .505], [.273, .485],
  [.313, .03], [0, .03],
].map(([radius, height]) => new Vector2(radius, height));

export function ChildrenBedroomWovenFloorBasket() {
  return (
    <group name="panier-de-sol-tresse-photo">
      <mesh name="basket-hollow-shell" castShadow receiveShadow>
        <latheGeometry args={[BASKET_PROFILE, 32]} />
        <ToonMaterial color={WICKER} />
        <Outlines color={WICKER_DARK} thickness={0.006} screenspace={false} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh
            key={angle}
            position={[
              Math.cos(angle) * 0.312,
              0.2,
              Math.sin(angle) * 0.312,
            ]}
            rotation={[0, -angle, Math.sin(angle) * 0.04]}
          >
            <cylinderGeometry args={[0.006, 0.008, 0.36, 6]} />
            <ToonMaterial color={index % 2 === 0 ? WICKER_LIGHT : "#c4935f"} />
          </mesh>
        );
      })}
      {[0.06, 0.13, 0.2, 0.27, 0.34].map((y, index) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.327 - index * 0.009, 0.009, 6, 32]} />
          <ToonMaterial color={index % 2 === 0 ? WICKER_LIGHT : WICKER_DARK} />
        </mesh>
      ))}
    </group>
  );
}

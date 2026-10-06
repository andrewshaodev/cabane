import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

/** Five spokes, paired casters, and the central gas lift. Wheels meet Y=0. */
export function OfficeChairBase() {
  return <group name="office-chair-base">
    <mesh position={[0, .285, 0]} castShadow>
      <cylinderGeometry args={[.022, .027, .29, 12]} /><ToonMaterial color="#777a76" />
    </mesh>
    <mesh position={[0, .175, 0]} castShadow>
      <cylinderGeometry args={[.045, .057, .12, 12]} /><ToonMaterial color="#444944" />
    </mesh>
    {Array.from({ length: 5 }, (_, index) => <group key={index} rotation={[0, index * Math.PI * 2 / 5, 0]}>
      <RoundedFurniturePanel size={[.044, .04, .306]} position={[0, .119, .153]}
        rotation={[.12, 0, 0]} color="#50564f" radius={.012} outline={false} />
      <mesh position={[0, .074, .308]} castShadow>
        <boxGeometry args={[.032, .054, .027]} /><ToonMaterial color="#555b53" />
      </mesh>
      {[-.022, .022].map((x) => <mesh key={x} position={[x, .032, .308]}
        rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[.032, .032, .024, 12]} /><ToonMaterial color="#343934" />
      </mesh>)}
    </group>)}
  </group>;
}

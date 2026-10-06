import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

/** Five spokes, paired casters, and the central gas lift. Wheels meet Y=0. */
export function OfficeChairBase() {
  return (
    <group name="office-chair-base">
      <mesh position={[0, 0.285, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.027, 0.29, 12]} />
        <ToonMaterial color="#777a76" />
      </mesh>
      <mesh position={[0, 0.175, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.057, 0.12, 12]} />
        <ToonMaterial color="#444944" />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => (
        <group key={index} rotation={[0, (index * Math.PI * 2) / 5, 0]}>
          <RoundedFurniturePanel
            size={[0.044, 0.04, 0.306]}
            position={[0, 0.119, 0.153]}
            rotation={[0.12, 0, 0]}
            color="#50564f"
            radius={0.012}
            outline={false}
          />
          <mesh position={[0, 0.074, 0.308]} castShadow>
            <boxGeometry args={[0.032, 0.054, 0.027]} />
            <ToonMaterial color="#555b53" />
          </mesh>
          {[-0.022, 0.022].map((x) => (
            <mesh key={x} position={[x, 0.032, 0.308]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.032, 0.032, 0.024, 12]} />
              <ToonMaterial color="#343934" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

import { ToonMaterial } from "@cabane/engine";
import { BrassCabinetHandle } from "./brass-cabinet-handle";
import { CabinetJoint } from "./cabinet-joint";
import {
  KITCHEN_CREAM,
  KITCHEN_CREAM_LIGHT,
  KITCHEN_OAK,
  KITCHEN_OAK_LIGHT,
  KITCHEN_STONE,
  KitchenBox,
} from "./kitchen-finish";
import { StoneVein } from "./stone-vein";

export function KitchenPeninsula() {
  return (
    <group name="retour-et-barre-du-u-custom">
      <KitchenBox
        size={[0.56, 0.83, 1.7]}
        position={[3.59, 0.425, 1.15]}
        color={KITCHEN_CREAM}
        outline="#71685d"
      />
      <mesh position={[3.298, 0.43, 1.15]} receiveShadow>
        <boxGeometry args={[0.018, 0.72, 1.64]} />
        <ToonMaterial color={KITCHEN_CREAM_LIGHT} />
      </mesh>
      {[0.74, 1.16, 1.58].map((jointZ) => (
        <CabinetJoint
          key={jointZ}
          from={[3.286, 0.07, jointZ]}
          to={[3.286, 0.79, jointZ]}
          color="#aaa298"
        />
      ))}
      <CabinetJoint
        from={[3.286, 0.63, 0.34]}
        to={[3.286, 0.63, 1.96]}
        color="#aaa298"
      />
      {[0.53, 0.95, 1.37, 1.79].map((handleZ) => (
        <group key={handleZ} position={[3.255, 0.7, handleZ]} rotation={[0, Math.PI / 2, 0]}>
          <BrassCabinetHandle position={[0, 0, 0]} />
        </group>
      ))}

      <KitchenBox
        size={[2.4, 0.83, 0.56]}
        position={[2.59, 0.425, 2.16]}
        color={KITCHEN_OAK}
        outline="#664326"
      />
      <mesh position={[2.59, 0.43, 2.449]} receiveShadow>
        <boxGeometry args={[2.34, 0.72, 0.018]} />
        <ToonMaterial color={KITCHEN_OAK_LIGHT} />
      </mesh>
      {[1.79, 2.59, 3.39].map((jointX) => (
        <CabinetJoint
          key={jointX}
          from={[jointX, 0.07, 2.461]}
          to={[jointX, 0.79, 2.461]}
          color="#815b39"
        />
      ))}
      <KitchenBox
        size={[0.82, 0.095, 1.9]}
        position={[3.54, 0.89, 1.2]}
        color={KITCHEN_STONE}
        outline="#81776b"
        receiveShadow
      />
      <KitchenBox
        size={[2.72, 0.095, 0.9]}
        position={[2.59, 0.89, 2.1]}
        color={KITCHEN_STONE}
        outline="#81776b"
        receiveShadow
      />
      <StoneVein
        points={[
          [3.2, 0.942, 0.51],
          [3.34, 0.944, 0.72],
          [3.31, 0.943, 0.98],
          [3.53, 0.945, 1.24],
          [3.62, 0.944, 1.5],
          [3.83, 0.944, 1.68],
        ]}
        width={0.007}
      />
      <StoneVein
        points={[
          [1.35, 0.944, 1.82],
          [1.61, 0.945, 1.93],
          [1.88, 0.943, 1.98],
          [2.16, 0.945, 2.13],
          [2.47, 0.944, 2.18],
          [2.76, 0.946, 2.34],
          [3.02, 0.944, 2.38],
        ]}
        width={0.006}
      />
    </group>
  );
}

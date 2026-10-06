import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { OfficeChairBase } from "./office-chair-base";

export const ERGONOMIC_OFFICE_CHAIR_SIZE = [.68, 1.04, .68] as const;

export function ErgonomicOfficeChair({ size = ERGONOMIC_OFFICE_CHAIR_SIZE }: { size?: SceneItemSize }) {
  return <group name="ergonomic-office-chair" scale={[size[0] / .68, size[1] / 1.04, size[2] / .68]}
    userData={{ walkCollider: true }}>
    <OfficeChairBase />
    <RoundedFurniturePanel size={[.43, .045, .43]} position={[0, .4375, .015]}
      color="#646b64" radius={.02} outline={false} />
    <RoundedFurniturePanel name="office-chair-seat" size={[.51, .085, .49]}
      position={[0, .5, .025]} color="#ddd4c2" radius={.039} />
    <RoundedFurniturePanel size={[.075, .27, .048]} position={[0, .59, -.23]}
      rotation={[-.12, 0, 0]} color="#61685f" radius={.014} outline={false} />
    <RoundedFurniturePanel name="office-chair-back-shell" size={[.465, .47, .057]}
      position={[0, .8033, -.2813]} rotation={[-.13, 0, 0]} color="#899086" radius={.025} />
    <RoundedFurniturePanel name="office-chair-padded-back" size={[.423, .428, .065]}
      position={[0, .8093, -.2413]} rotation={[-.13, 0, 0]} color="#e0d8c8" radius={.03} />
    <RoundedFurniturePanel name="office-chair-lumbar-pad" size={[.34, .09, .045]}
      position={[0, .6543, -.1973]} color="#c9c1ae" radius={.019} outline={false} />
    {[-.3025, .3025].map((x) => <group key={x}>
      <mesh name="office-chair-arm-bracket" position={[Math.sign(x) * .26, .458, .005]} castShadow>
        <boxGeometry args={[.115, .035, .04]} /><ToonMaterial color="#787f75" />
      </mesh>
      <RoundedFurniturePanel size={[.032, .21, .036]} position={[x, .56, .005]}
        color="#787f75" radius={.01} outline={false} />
      <RoundedFurniturePanel name="office-chair-armrest" size={[.075, .04, .265]}
        position={[x, .67, .035]} color="#555d54" radius={.017} />
    </group>)}
    <mesh name="office-chair-height-lever" position={[.23, .423, -.04]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[.012, .012, .14, 8]} /><ToonMaterial color="#444b42" />
    </mesh>
  </group>;
}

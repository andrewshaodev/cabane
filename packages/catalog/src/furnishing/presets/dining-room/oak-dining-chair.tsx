import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { CurvedChairBack } from "./curved-chair-back";

export const OAK_DINING_CHAIR_SIZE = [.49, .82, .5] as const;

export function OakDiningChair({ size = OAK_DINING_CHAIR_SIZE }: { size?: SceneItemSize }) {
  return <group name="oak-dining-chair" scale={[size[0] / .49, size[1] / .82, size[2] / .5]}
    userData={{ walkCollider: true }}>
    {[-.18, .18].flatMap((x) => [-.165, .17].map((z) => <mesh
      key={`${x}-${z}`} name="dining-chair-leg" position={[x, .21, z]} castShadow>
      <cylinderGeometry args={[.022, .016, .42, 10]} /><ToonMaterial color="#c7a16d" />
    </mesh>))}
    <RoundedFurniturePanel size={[.46, .045, .47]} position={[0, .4175, .015]}
      color="#c8a572" radius={.018} />
    <RoundedFurniturePanel name="dining-chair-upholstered-seat" size={[.445, .045, .435]}
      position={[0, .4625, .0225]} color="#e3d7c2" radius={.019} />
    {[-.185, .185].map((x) => <mesh key={x} position={[x, .5725, -.19]} castShadow>
      <cylinderGeometry args={[.018, .023, .31, 10]} /><ToonMaterial color="#c9a674" />
    </mesh>)}
    <CurvedChairBack />
  </group>;
}

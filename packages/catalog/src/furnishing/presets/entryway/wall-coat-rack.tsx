import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WALL_COAT_RACK_SIZE = [.8, .32, .22] as const;

/** Wall panel with a shallow top shelf and five supported coat hooks. */
export function WallCoatRack({ size = WALL_COAT_RACK_SIZE }: { size?: SceneItemSize }) {
  return <group name="wall-coat-rack"
    scale={[size[0] / .8, size[1] / .32, size[2] / .22]}>
    <RoundedFurniturePanel size={[.8, .30, .035]} position={[0, .15, .0175]}
      color="#cfaa76" radius={.008} />
    <RoundedFurniturePanel name="coat-rack-top-shelf" size={[.78, .05, .22]}
      position={[0, .295, .11]} color="#d9b682" radius={.007} />
    {[-.30, -.15, 0, .15, .30].map((x) => <group key={x} position={[x, .14, .04]}>
      <mesh name="coat-hook-support" position={[0, 0, .035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[.018, .018, .07, 10]} /><ToonMaterial color="#707975" />
      </mesh>
      <mesh name="coat-hook-tip" position={[0, .038, .075]}>
        <cylinderGeometry args={[.014, .014, .08, 10]} /><ToonMaterial color="#707975" />
      </mesh>
    </group>)}
  </group>;
}

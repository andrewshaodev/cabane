import { BlasterFinish } from "./BlasterFinish";

export function BlasterReactor({ side }: { side: number }) {
  return <group name="blaster-side-reactor" position={[side * .103, .035, .125]} rotation={[0, side * Math.PI / 2, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.062, .062, .022, 40]} /><BlasterFinish kind="chassis" /></mesh>
    <mesh position={[0, 0, .009]}><torusGeometry args={[.047, .012, 12, 40]} /><BlasterFinish kind="trim" /></mesh>
    <mesh position={[0, 0, .01]} scale={[1, 1, .48]}><sphereGeometry args={[.037, 32, 16]} /><BlasterFinish kind="energy" /></mesh>
    <mesh position={[-.011, .014, .027]} scale={[1, .65, .35]}><sphereGeometry args={[.009, 16, 8]} /><BlasterFinish kind="glint" /></mesh>
    <mesh position={[0, 0, .017]}><torusGeometry args={[.036, .0035, 8, 32]} /><BlasterFinish kind="energy" /></mesh>
  </group>;
}

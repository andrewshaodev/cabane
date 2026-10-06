import { RoundedBox } from "@cabane/engine";
import { BlasterFinish } from "./BlasterFinish";

/** A padded right glove wrapped around the pistol grip, in the toy's coating palette. */
export function BlasterGlove() {
  return <group name="blaster-gloved-hand">
    {/* The wrist enters from below and behind the grip. */}
    <group position={[.065, -.285, .285]} rotation={[-.5, 0, -.18]}>
      <mesh scale={[.066, .13, .067]}><sphereGeometry args={[1, 24, 16]} /><BlasterFinish kind="grip" /></mesh>
      <RoundedBox args={[.145, .065, .14]} radius={.024} position={[0, -.065, 0]}><BlasterFinish kind="armor" /></RoundedBox>
      <RoundedBox args={[.151, .015, .145]} radius={.006} position={[0, -.046, 0]}><BlasterFinish kind="trim" /></RoundedBox>
      <RoundedBox args={[.062, .024, .013]} radius={.006} position={[0, -.062, .075]}><BlasterFinish kind="energy" /></RoundedBox>
    </group>
    <mesh position={[.057, -.177, .205]} rotation={[-.3, 0, -.1]} scale={[.072, .103, .065]}>
      <sphereGeometry args={[1, 24, 16]} /><BlasterFinish kind="grip" />
    </mesh>
    {/* Rounded ivory knuckle armor faces the player, with three curled fingers. */}
    <RoundedBox args={[.086, .107, .033]} radius={.016} position={[.077, -.167, .255]} rotation={[-.3, -.2, -.12]}><BlasterFinish kind="armor" /></RoundedBox>
    {[0, 1, 2].map(index => <group key={index} position={[0, -.151 - index * .036, .126 + index * .016]} rotation={[-.3, 0, 0]}>
      <RoundedBox args={[.137, .032, .063]} radius={.015}><BlasterFinish kind="grip" /></RoundedBox>
      <RoundedBox args={[.037, .025, .051]} radius={.01} position={[.058, 0, .007]}><BlasterFinish kind="armor" /></RoundedBox>
    </group>)}
    {/* Index finger curls toward the trigger; thumb rests along the far side. */}
    <RoundedBox args={[.038, .037, .104]} radius={.016} position={[.046, -.101, .055]} rotation={[.18, -.25, 0]}><BlasterFinish kind="grip" /></RoundedBox>
    <mesh position={[-.055, -.101, .165]} rotation={[.4, 0, -.3]} scale={[.029, .06, .034]}>
      <sphereGeometry args={[1, 20, 12]} /><BlasterFinish kind="grip" />
    </mesh>
  </group>;
}

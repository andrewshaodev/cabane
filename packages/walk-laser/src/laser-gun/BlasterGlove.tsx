import { RoundedBox } from "@cabane/engine";
import { BlasterFinish } from "./BlasterFinish";

/** A padded right glove wrapped around the pistol grip, in the toy's coating palette. */
export function BlasterGlove() {
  return (
    <group name="blaster-gloved-hand">
      {/* The wrist enters from below and behind the grip. */}
      <group position={[0.065, -0.285, 0.285]} rotation={[-0.5, 0, -0.18]}>
        <mesh scale={[0.066, 0.13, 0.067]}>
          <sphereGeometry args={[1, 24, 16]} />
          <BlasterFinish kind="grip" />
        </mesh>
        <RoundedBox args={[0.145, 0.065, 0.14]} radius={0.024} position={[0, -0.065, 0]}>
          <BlasterFinish kind="armor" />
        </RoundedBox>
        <RoundedBox args={[0.151, 0.015, 0.145]} radius={0.006} position={[0, -0.046, 0]}>
          <BlasterFinish kind="trim" />
        </RoundedBox>
        <RoundedBox args={[0.062, 0.024, 0.013]} radius={0.006} position={[0, -0.062, 0.075]}>
          <BlasterFinish kind="energy" />
        </RoundedBox>
      </group>
      <mesh
        position={[0.057, -0.177, 0.205]}
        rotation={[-0.3, 0, -0.1]}
        scale={[0.072, 0.103, 0.065]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <BlasterFinish kind="grip" />
      </mesh>
      {/* Rounded ivory knuckle armor faces the player, with three curled fingers. */}
      <RoundedBox
        args={[0.086, 0.107, 0.033]}
        radius={0.016}
        position={[0.077, -0.167, 0.255]}
        rotation={[-0.3, -0.2, -0.12]}
      >
        <BlasterFinish kind="armor" />
      </RoundedBox>
      {[0, 1, 2].map((index) => (
        <group
          key={index}
          position={[0, -0.151 - index * 0.036, 0.126 + index * 0.016]}
          rotation={[-0.3, 0, 0]}
        >
          <RoundedBox args={[0.137, 0.032, 0.063]} radius={0.015}>
            <BlasterFinish kind="grip" />
          </RoundedBox>
          <RoundedBox args={[0.037, 0.025, 0.051]} radius={0.01} position={[0.058, 0, 0.007]}>
            <BlasterFinish kind="armor" />
          </RoundedBox>
        </group>
      ))}
      {/* Index finger curls toward the trigger; thumb rests along the far side. */}
      <RoundedBox
        args={[0.038, 0.037, 0.104]}
        radius={0.016}
        position={[0.046, -0.101, 0.055]}
        rotation={[0.18, -0.25, 0]}
      >
        <BlasterFinish kind="grip" />
      </RoundedBox>
      <mesh
        position={[-0.055, -0.101, 0.165]}
        rotation={[0.4, 0, -0.3]}
        scale={[0.029, 0.06, 0.034]}
      >
        <sphereGeometry args={[1, 20, 12]} />
        <BlasterFinish kind="grip" />
      </mesh>
    </group>
  );
}

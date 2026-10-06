import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ExtrudeGeometry, Shape, type Group } from "three";
import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { fanSpeedFactor } from "./fan-operation";

/** Swept, rounded blades in the XY plane, turning about the motor's Z axis. */
export function FanRotor({ radius, count, color, state, visualState, reducedMotion }: {
  radius: number;
  count: number;
  color: string;
} & Pick<HomeDeviceModelProps, "state" | "visualState" | "reducedMotion">) {
  const rotor = useRef<Group>(null);
  const geometry = useMemo(() => {
    const blade = new Shape();
    blade.moveTo(radius * .12, -radius * .07);
    blade.quadraticCurveTo(radius * .55, -radius * .22, radius * .85, -radius * .14);
    blade.quadraticCurveTo(radius, -radius * .10, radius, 0);
    blade.quadraticCurveTo(radius * .96, radius * .16, radius * .78, radius * .18);
    blade.lineTo(radius * .16, radius * .09);
    blade.closePath();
    const result = new ExtrudeGeometry(blade, {
      depth: radius * .03, bevelEnabled: false, curveSegments: 4, steps: 1,
    });
    result.translate(0, 0, -radius * .015);
    return result;
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const speed = fanSpeedFactor({ state, visualState });
  useFrame(({ invalidate }, delta) => {
    if (!rotor.current || reducedMotion || speed === 0) return;
    rotor.current.rotation.z = (rotor.current.rotation.z - Math.min(delta, .05) * speed * 12) % (Math.PI * 2);
    invalidate();
  });
  return <group ref={rotor} name="fan-rotor">
    {Array.from({ length: count }, (_, index) => <mesh key={index} name={`fan-blade-${index}`}
      geometry={geometry} rotation={[0, 0, index * Math.PI * 2 / count]} castShadow>
      <ToonMaterial color={color} />
      <Outlines color="#52605b" thickness={.0015} screenspace={false} />
    </mesh>)}
  </group>;
}

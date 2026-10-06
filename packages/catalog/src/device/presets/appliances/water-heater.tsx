import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Shape, type Group } from "three";

const bolt = new Shape();
bolt.moveTo(0.005, 0.042);
bolt.lineTo(-0.025, 0.002);
bolt.lineTo(-0.005, 0.002);
bolt.lineTo(-0.014, -0.042);
bolt.lineTo(0.027, 0.011);
bolt.lineTo(0.006, 0.011);
bolt.closePath();

function PowerIndicator({
  visualState,
  reducedMotion,
}: Pick<HomeDeviceModelProps, "visualState" | "reducedMotion">) {
  const symbol = useRef<Group>(null);
  const active = visualState === "connected-active";

  useFrame(({ clock, invalidate }) => {
    if (!symbol.current) return;
    const scale = active && !reducedMotion ? 0.94 + 0.09 * Math.sin(clock.elapsedTime * 3.5) : 1;
    symbol.current.scale.setScalar(scale);
    if (active && !reducedMotion) invalidate();
  });

  const color = active
    ? "#f2b45e"
    : visualState === "connected-inactive"
      ? "#799b89"
      : visualState === "unavailable"
        ? "#d4a04c"
        : "#8b918c";
  return (
    <group ref={symbol} name={`water-heater-power-${visualState}`} position={[0, 0.42, 0.218]}>
      <mesh>
        <shapeGeometry args={[bolt]} />
        <ToonMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.55 : 0.04}
          side={2}
        />
      </mesh>
    </group>
  );
}

export function WaterHeaterModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  return (
    <group name="catalog-water-heater">
      <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 1.14, 0.4]} />
        <ToonMaterial color="#e8e5dc" />
        <Outlines color="#797b76" thickness={0.006} />
      </mesh>
      <mesh position={[0, 1.36, 0]} scale={[1, 0.34, 0.72]} castShadow>
        <sphereGeometry args={[0.28, 18, 10]} />
        <ToonMaterial color="#ddd9cf" />
        <Outlines color="#797b76" thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.42, 0.205]}>
        <boxGeometry args={[0.16, 0.12, 0.02]} />
        <ToonMaterial color="#26302f" />
        <Outlines color="#171d1c" thickness={0.003} />
      </mesh>
      <PowerIndicator visualState={visualState} reducedMotion={reducedMotion} />
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.11, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 10]} />
          <ToonMaterial color="#9da4a1" />
        </mesh>
      ))}
    </group>
  );
}

import { ToonMaterial } from "@cabane/engine";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, type Group } from "three";
import { usePortalAppearance } from "./usePortalAppearance";
import { PORTAL_COLORS, PORTAL_HEIGHT, PORTAL_WIDTH, type PortalAnchor, type PortalColor } from "./portal-contract";

const noRaycast = () => undefined;

/** Opaque energy membrane: no render targets, reflections, or view into the other room. */
export function PortalSurface({ anchor, color, linked, reducedMotion }: {
  anchor: PortalAnchor; color: PortalColor; linked: boolean; reducedMotion: boolean;
}) {
  const energy = useRef<Group>(null);
  const { opening, ripple } = usePortalAppearance(anchor, reducedMotion);
  const tint = PORTAL_COLORS[color];
  useFrame((_, delta) => {
    if (energy.current && !reducedMotion) energy.current.rotation.z += delta * (color === "blue" ? .3 : -.3);
  });
  return <group name={`gun-portal-${color}`} position={anchor.center.toArray()} quaternion={anchor.rotation.toArray()} userData={{ walkToolVisual: true }}>
    <group ref={opening} name="portal-opening">
    <group scale={[PORTAL_WIDTH, PORTAL_HEIGHT, 1]}>
      <mesh raycast={noRaycast}>
        <circleGeometry args={[1, 64]} />
        <ToonMaterial color={color === "blue" ? "#102d49" : "#443024"} emissive={tint} emissiveIntensity={linked ? .12 : .025} side={DoubleSide} />
      </mesh>
      <mesh raycast={noRaycast} position={[0, 0, .012]}>
        <torusGeometry args={[1, .045, 8, 64]} />
        <ToonMaterial color={tint} emissive={tint} emissiveIntensity={linked ? 1.5 : .45} toneMapped={false} />
      </mesh>
      <mesh raycast={noRaycast} position={[0, 0, .014]}>
        <torusGeometry args={[.94, .012, 6, 64]} />
        <ToonMaterial color="#fff0d5" emissive={tint} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh ref={ripple} name="portal-arrival-ripple" position={[0, 0, .028]} raycast={noRaycast} visible={false}>
        <torusGeometry args={[1, .025, 6, 64]} />
        <ToonMaterial color={tint} emissive={tint} emissiveIntensity={2} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={energy} position={[0, 0, .022]}>
        {[.36, .61, .82].map((radius, index) => <mesh key={radius} rotation={[0, 0, index * 2.1]} raycast={noRaycast}>
          <torusGeometry args={[radius, .012, 6, 32, Math.PI * 1.15]} />
          <ToonMaterial color={tint} emissive={tint} emissiveIntensity={.7} transparent opacity={linked ? .55 : .16} depthWrite={false} toneMapped={false} />
        </mesh>)}
      </group>
    </group>
    </group>
  </group>;
}

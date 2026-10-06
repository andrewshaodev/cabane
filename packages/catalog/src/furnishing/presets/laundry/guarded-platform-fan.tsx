import { Path, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { PlatformFanGuardWire } from "./platform-fan-guard-wire";

export const GUARDED_PLATFORM_FAN_SIZE = [0.14, 0.03, 0.14] as const;
const frame = new Shape();
frame.moveTo(-0.07, -0.07);
frame.lineTo(0.07, -0.07);
frame.lineTo(0.07, 0.07);
frame.lineTo(-0.07, 0.07);
frame.closePath();
const aperture = new Path();
aperture.absarc(0, 0, 0.056, 0, Math.PI * 2, true);
frame.holes.push(aperture);

/** Static upward-facing fan and raised wire guard; no connected capability inferred. */
export function GuardedPlatformFan({ size = GUARDED_PLATFORM_FAN_SIZE }: { size?: SceneItemSize }) {
  const corner = 0.057 / Math.sqrt(2);
  return (
    <group name="guarded-platform-fan" scale={[size[0] / 0.14, size[1] / 0.03, size[2] / 0.14]}>
      <mesh name="platform-fan-mount" rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[frame, { depth: 0.012, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color="#252b29" />
      </mesh>
      <mesh name="platform-fan-hub" position={[0, 0.016, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.016, 12]} />
        <ToonMaterial color="#303733" />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => (
        <group key={index} rotation={[0, (index * Math.PI * 2) / 5, 0]}>
          <mesh
            name={`platform-fan-blade-${index}`}
            position={[0.026, 0.013, 0]}
            rotation={[0, 0.35, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.034, 0.004, 0.018]} />
            <ToonMaterial color="#303733" />
          </mesh>
        </group>
      ))}
      {[0.02, 0.038, 0.057].map((radius) => (
        <mesh
          key={radius}
          name={`platform-fan-guard-ring-${radius}`}
          position={[0, 0.0285, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[radius, 0.0015, 4, 32]} />
          <ToonMaterial color="#afb2aa" />
        </mesh>
      ))}
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}:${z}`}>
            <PlatformFanGuardWire
              name={`platform-fan-guard-spoke-${x}:${z}`}
              from={[0, 0.0285, 0]}
              to={[x * corner, 0.0285, z * corner]}
            />
            <PlatformFanGuardWire
              name={`platform-fan-guard-leg-${x}:${z}`}
              from={[x * corner, 0.0285, z * corner]}
              to={[x * 0.063, 0.0115, z * 0.063]}
            />
          </group>
        )),
      )}
    </group>
  );
}

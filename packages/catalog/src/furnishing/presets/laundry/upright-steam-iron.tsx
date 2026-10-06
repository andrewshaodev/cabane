import { Path, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const UPRIGHT_STEAM_IRON_SIZE = [0.12, 0.3, 0.13] as const;
const sole = new Shape();
sole.moveTo(-0.06, 0);
sole.lineTo(0.06, 0);
sole.lineTo(0.058, 0.09);
sole.quadraticCurveTo(0.028, 0.27, 0, 0.3);
sole.quadraticCurveTo(-0.028, 0.27, -0.058, 0.09);
sole.closePath();
const body = new Shape();
body.moveTo(-0.055, 0);
body.lineTo(0.055, 0);
body.lineTo(0.053, 0.07);
body.quadraticCurveTo(0.022, 0.21, 0, 0.24);
body.quadraticCurveTo(-0.022, 0.21, -0.053, 0.07);
body.closePath();
const grip = new Shape();
grip.moveTo(-0.03, 0.08);
grip.lineTo(-0.032, 0.2);
grip.quadraticCurveTo(-0.025, 0.25, 0, 0.27);
grip.quadraticCurveTo(0.031, 0.25, 0.035, 0.18);
grip.lineTo(0.03, 0.08);
grip.closePath();
const aperture = new Path();
aperture.absellipse(0, 0.18, 0.016, 0.047, 0, Math.PI * 2, true);
grip.holes.push(aperture);
export function UprightSteamIron({ size = UPRIGHT_STEAM_IRON_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="upright-steam-iron" scale={[size[0] / 0.12, size[1] / 0.3, size[2] / 0.13]}>
      <mesh name="iron-soleplate" position={[0, 0, -0.065]} castShadow receiveShadow>
        <extrudeGeometry args={[sole, { depth: 0.005, bevelEnabled: false, curveSegments: 12 }]} />
        <ToonMaterial color="#a9b1af" />
      </mesh>
      <mesh name="iron-white-body" position={[0, 0, -0.06]} castShadow receiveShadow>
        <extrudeGeometry args={[body, { depth: 0.09, bevelEnabled: false, curveSegments: 12 }]} />
        <ToonMaterial color="#edece4" />
      </mesh>
      <mesh name="iron-purple-handle" position={[0, 0, 0.02]} castShadow receiveShadow>
        <extrudeGeometry args={[grip, { depth: 0.045, bevelEnabled: false, curveSegments: 12 }]} />
        <ToonMaterial color="#79618f" />
      </mesh>
    </group>
  );
}

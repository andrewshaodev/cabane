import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const ROUND_GLOBE_WALL_LAMP_SIZE = [0.24, 0.24, 0.16] as const;
/** Static visual: no connected capability is inferred from appearance. */
export function RoundGlobeWallLamp({size=ROUND_GLOBE_WALL_LAMP_SIZE}: {size?:SceneItemSize}) {
 return <group name="round-globe-wall-lamp" scale={[size[0]/0.24,size[1]/0.24,size[2]/0.16]}><mesh position={[0,.12,-.05]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,.06,32]} /><ToonMaterial color="#e9e8df" /></mesh>
<mesh position={[0,.12,.015]}><sphereGeometry args={[.065,24,16]} /><ToonMaterial color="#f7f6ee" /></mesh></group>;
}

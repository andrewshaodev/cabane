import { Path } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { wringerBucketRing, wringerBucketSection } from "./wringer-bucket-section";
export const WRINGER_BUCKET_SIZE = [0.34, 0.34, 0.28] as const;
const body = wringerBucketRing(0.324, 0.264, 0.296, 0.236);
const rim = wringerBucketRing(0.34, 0.28, 0.296, 0.236);
const tray = wringerBucketSection(0.17, 0.256, 0.022);
const mouth = new Path();
mouth.absellipse(0, 0, 0.055, 0.08, 0, Math.PI * 2, true);
tray.holes.push(mouth);
const base = wringerBucketSection(0.304, 0.244, 0.022);
export function WringerBucket({ size = WRINGER_BUCKET_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="wringer-bucket" scale={[size[0] / 0.34, size[1] / 0.34, size[2] / 0.28]}>
      <mesh name="bucket-shell" rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[body, { depth: 0.326, bevelEnabled: false, curveSegments: 8 }]} />
        <ToonMaterial color="#939a90" />
      </mesh>
      <mesh name="bucket-bottom" rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[base, { depth: 0.018, bevelEnabled: false, curveSegments: 8 }]} />
        <ToonMaterial color="#939a90" />
      </mesh>
      <mesh
        name="bucket-black-rim"
        position={[0, 0.326, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[rim, { depth: 0.014, bevelEnabled: false, curveSegments: 8 }]} />
        <ToonMaterial color="#252b29" />
      </mesh>
      <mesh
        name="bucket-wringer-tray"
        position={[0.066, 0.326, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[tray, { depth: 0.008, bevelEnabled: false, curveSegments: 8 }]} />
        <ToonMaterial color="#c0c3b7" />
      </mesh>
    </group>
  );
}

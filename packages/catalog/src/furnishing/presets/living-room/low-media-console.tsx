import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const LOW_MEDIA_CONSOLE_SIZE = [1.6, .55, .42] as const;

/** Standalone low media cabinet; intentionally does not include a television. */
export function LowMediaConsole({ size = LOW_MEDIA_CONSOLE_SIZE }: { size?: SceneItemSize }) {
  return <group name="low-media-console"
    scale={[size[0] / 1.6, size[1] / .55, size[2] / .42]}
    userData={{ walkCollider: true }}>
    {[-.68, .68].flatMap((x) => [-.15, .15].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .035, z]} castShadow>
      <boxGeometry args={[.05, .07, .05]} /><ToonMaterial color="#9d754c" />
    </mesh>))}
    <RoundedFurniturePanel size={[1.6, .45, .38]} position={[0, .295, -.01]}
      color="#d7b782" radius={.012} />
    {[-.54, .54].map((x) => <RoundedFurniturePanel key={x} name="media-console-door"
      size={[.45, .34, .03]} position={[x, .30, .195]} color="#e5dfd2" radius={.008} />)}
    <RoundedFurniturePanel name="media-console-open-niche" size={[.45, .27, .03]}
      position={[0, .335, .195]} color="#9b7a52" radius={.006} outline={false} />
    <mesh name="media-console-cable-port" position={[0, .39, -.205]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.035, .035, .01, 14]} /><ToonMaterial color="#594f43" />
    </mesh>
    <RoundedFurniturePanel size={[1.6, .03, .42]} position={[0, .535, 0]}
      color="#cfa873" radius={.006} />
  </group>;
}

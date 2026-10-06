import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TWO_DOOR_MIRROR_CABINET_SIZE = [0.7, 0.96, 0.14] as const;
/** Closed two-door mirror storage; side lighting panels and shelf extensions are separate items. */
export function TwoDoorMirrorCabinet({
  size = TWO_DOOR_MIRROR_CABINET_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="two-door-mirror-cabinet" scale={[size[0] / 0.7, size[1] / 0.96, size[2] / 0.14]}>
      <mesh name="mirror-case-back" position={[0, 0.48, 0.006]}>
        <boxGeometry args={[0.7, 0.96, 0.012]} />
        <ToonMaterial color="#e8e6df" />
      </mesh>
      {[-0.343, 0.343].map((x) => (
        <mesh key={x} name="mirror-case-side" position={[x, 0.48, 0.069]}>
          <boxGeometry args={[0.014, 0.96, 0.114]} />
          <ToonMaterial color="#e8e6df" />
        </mesh>
      ))}
      {[0.007, 0.953].map((y) => (
        <mesh key={y} name="mirror-case-horizontal" position={[0, y, 0.069]}>
          <boxGeometry args={[0.672, 0.014, 0.114]} />
          <ToonMaterial color="#e8e6df" />
        </mesh>
      ))}
      {[-0.175, 0.175].map((x) => (
        <mesh key={x} name="mirror-door" position={[x, 0.48, 0.133]} castShadow receiveShadow>
          <boxGeometry args={[0.346, 0.956, 0.014]} />
          <ToonMaterial color="#b6c5c0" />
        </mesh>
      ))}
    </group>
  );
}

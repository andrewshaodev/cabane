import { Outlines, ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const WHITE_CORNER_WARDROBE_SIZE = [1.8, 2.35, 1.2] as const;

export function WhiteCornerWardrobe({
  size = WHITE_CORNER_WARDROBE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="white-corner-wardrobe"
      scale={[size[0] / 1.8, size[1] / 2.35, size[2] / 1.2]}
      userData={{ walkCollider: true }}
    >
      <mesh position={[0, 1.185, -.3]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.29, .6]} />
        <ToonMaterial color="#e8e6df" />
        <Outlines color="#aaa89f" thickness={.004} />
      </mesh>
      <mesh position={[-.6, 1.185, .3]} castShadow receiveShadow>
        <boxGeometry args={[.6, 2.29, .6]} />
        <ToonMaterial color="#e8e6df" />
        <Outlines color="#aaa89f" thickness={.004} />
      </mesh>
      <mesh position={[0, .02, -.3]} receiveShadow>
        <boxGeometry args={[1.8, .04, .6]} />
        <ToonMaterial color="#cbc9c1" />
      </mesh>
      <mesh position={[-.6, .02, .3]} receiveShadow>
        <boxGeometry args={[.6, .04, .6]} />
        <ToonMaterial color="#cbc9c1" />
      </mesh>
      <mesh position={[0, 2.34, -.3]} castShadow>
        <boxGeometry args={[1.8, .02, .6]} />
        <ToonMaterial color="#f1efe9" />
      </mesh>
      <mesh position={[-.6, 2.34, .3]} castShadow>
        <boxGeometry args={[.6, .02, .6]} />
        <ToonMaterial color="#f1efe9" />
      </mesh>

      {[-.6, 0, .6].map((x) => (
        <group key={x}>
          <mesh name="corner-wardrobe-long-door" position={[x, 1.18, .01]} castShadow>
            <boxGeometry args={[.586, 2.24, .02]} />
            <ToonMaterial color="#f3f1eb" />
            <Outlines color="#b8b5ad" thickness={.0025} />
          </mesh>
          <mesh position={[x + (x === .6 ? -.22 : .22), 1.15, .024]} castShadow>
            <boxGeometry args={[.018, .25, .008]} />
            <ToonMaterial color="#d7d4cc" />
          </mesh>
        </group>
      ))}
      <mesh
        name="corner-wardrobe-return-door"
        position={[-.292, 1.18, .3]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      >
        <boxGeometry args={[.586, 2.24, .016]} />
        <ToonMaterial color="#f3f1eb" />
        <Outlines color="#b8b5ad" thickness={.0025} />
      </mesh>
      <mesh position={[-.278, 1.15, .49]} castShadow>
        <boxGeometry args={[.008, .25, .018]} />
        <ToonMaterial color="#d7d4cc" />
      </mesh>
    </group>
  );
}

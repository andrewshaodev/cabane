import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const CLIP_READING_LAMP_SIZE = [0.07, 0.48, 0.186125] as const;
const neckPoints = [
  new Vector3(0, 0.12, 0.032),
  new Vector3(0, 0.145, 0.105),
  new Vector3(0, 0.22, 0.14),
  new Vector3(0, 0.32, 0.13),
  new Vector3(0, 0.4, 0.09),
];

/** Static white clip light; the 40 mm jaw opening surrounds a vertical bed rail. */
export function ClipReadingLamp({ size = CLIP_READING_LAMP_SIZE }: { size?: SceneItemSize }) {
  const neck = useMemo(
    () => new TubeGeometry(new CatmullRomCurve3(neckPoints), 24, 0.005, 6, false),
    [],
  );
  useEffect(() => () => neck.dispose(), [neck]);
  return (
    <group name="clip-reading-lamp" scale={[size[0] / 0.07, size[1] / 0.48, size[2] / 0.186125]}>
      {[-1, 1].map((side) => (
        <RoundedFurniturePanel
          key={side}
          name={`clip-jaw-${side}`}
          size={[0.07, 0.12, 0.02]}
          position={[0, 0.06, side * 0.03]}
          color="#f1f0e9"
          radius={0.003}
          outline={false}
        />
      ))}
      <RoundedFurniturePanel
        name="clip-bridge"
        size={[0.07, 0.012, 0.08]}
        position={[0, 0.126, 0]}
        color="#f1f0e9"
        radius={0.002}
        outline={false}
      />
      <mesh name="clip-flexible-neck" geometry={neck} castShadow receiveShadow>
        <ToonMaterial color="#e9e8e2" />
      </mesh>
      <group position={[0, 0.4335, 0.072]} rotation={[-0.5, 0, 0]}>
        <mesh name="clip-lamp-shade" castShadow receiveShadow>
          <cylinderGeometry args={[0.026, 0.009, 0.078, 16]} />
          <ToonMaterial color="#f2f1eb" />
        </mesh>
        <mesh name="clip-lamp-diffuser" position={[0, 0.0395, 0]}>
          <cylinderGeometry args={[0.023, 0.023, 0.001, 16]} />
          <ToonMaterial color="#fff9df" />
        </mesh>
      </group>
    </group>
  );
}

import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TOILETRY_TUBE_SIZE = [0.05, 0.18, 0.03] as const;
/** Cap-supported squeeze tube with a broad sealed crimp; colors represent generic packaging. */
export function ToiletryTube({
  size = TOILETRY_TUBE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [w, h, d] = size,
    capH = h * 0.14,
    crimpH = h * 0.025,
    bodyD = d * 0.86;
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-w * 0.3, capH);
    shape.lineTo(w * 0.3, capH);
    shape.lineTo(w / 2, h - crimpH);
    shape.lineTo(-w / 2, h - crimpH);
    shape.closePath();
    return new ExtrudeGeometry(shape, { depth: bodyD, bevelEnabled: false });
  }, [w, h, capH, crimpH, bodyD]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const color = variant === "yellow" ? "#d7b749" : variant === "brown" ? "#a78978" : "#eee9de";
  return (
    <group name="toiletry-tube">
      <mesh name="tube-cap" position={[0, capH / 2, 0]}>
        <cylinderGeometry args={[Math.min(w * 0.29, d / 2), Math.min(w * 0.29, d / 2), capH, 16]} />
        <ToonMaterial color="#e7e3d8" />
      </mesh>
      <mesh name="tube-body" geometry={geometry} position={[0, 0, -bodyD / 2]}>
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="tube-crimp" position={[0, h - crimpH / 2, 0]}>
        <boxGeometry args={[w, crimpH, d]} />
        <ToonMaterial color={color} />
      </mesh>
    </group>
  );
}

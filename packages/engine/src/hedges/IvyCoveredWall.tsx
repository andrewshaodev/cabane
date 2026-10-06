import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { ToonMaterial } from "../rendering";
import { hedgeFoliageLobe, mergeHedgeFoliage } from "./hedge-foliage-geometry";

export function IvyCoveredWall({ length, height, width }: { length: number; height: number; width: number }) {
  const foliage = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const columns = Math.min(100, Math.max(2, Math.ceil(length / .32)));
    const rows = Math.min(16, Math.max(2, Math.ceil(height / .3)));
    for (let col = 0; col < columns; col++) {
      const x = -length / 2 + (col + .5) * length / columns;
      for (const side of [-1, 1]) for (let row = 0; row < rows; row++) {
        const seed = col * 7.1 + row * 3.7 + side;
        const y = (row + .5 + Math.sin(seed * 2.3) * .26) * height / rows;
        parts.push(hedgeFoliageLobe([x + Math.sin(seed) * length / columns * .22, y, side * width * .23],
          [length / columns * (.65 + .12 * Math.sin(seed)), height / rows * (.66 + .13 * Math.cos(seed)), width * (.23 + .04 * Math.sin(seed * 3))],
          ["#365b32", "#497239", "#5b8040", "#426632"][Math.abs(Math.floor(Math.sin(seed) * 97)) % 4], seed));
      }
      // Dense growth spills over the cap into irregular hanging clusters.
      parts.push(hedgeFoliageLobe([x, height * .96, Math.sin(col * 2.4) * width * .1],
        [length / columns * .7, height * .065, width * .46], "#63864a", col));
    }
    return mergeHedgeFoliage(parts);
  }, [length, height, width]);
  useEffect(() => () => foliage.dispose(), [foliage]);
  return <group name="dense-ivy-covered-wall">
    <mesh position={[0, height * .47, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height * .94, width * .35]} /><ToonMaterial color="#a59b80" />
    </mesh>
    <mesh geometry={foliage} castShadow receiveShadow><ToonMaterial vertexColors /></mesh>
  </group>;
}

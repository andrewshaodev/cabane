import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { ToonMaterial } from "../rendering";
import { hedgeFoliageLobe, mergeHedgeFoliage } from "./hedge-foliage-geometry";

/** Interleaved broad laurel crowns and slender, flowering oleander sprays. */
export function MixedPlantHedge({ length, height, width }: { length: number; height: number; width: number }) {
  const geometry = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const count = Math.min(90, Math.max(3, Math.ceil(length / (width * .55))));
    const step = length / count;
    for (let i = 0; i < count; i++) {
      const x = -length / 2 + (i + .5) * step;
      const oleander = i % 3 === 1;
      const top = height * (.86 + .1 * Math.sin(i * 2.7 + 1));
      for (let lobe = 0; lobe < 7; lobe++) {
        const angle = lobe * 2.4 + i;
        const y = top * (.32 + lobe * .075);
        const at = [x + Math.cos(angle) * step * .18, y, Math.sin(angle) * width * .22] as const;
        parts.push(hedgeFoliageLobe(at,
          [step * (oleander ? .48 : .68), top * (oleander ? .24 : .2), width * (oleander ? .22 : .3)],
          oleander ? ["#507547", "#64834e"][lobe % 2] : ["#355c36", "#426c39", "#587e43"][lobe % 3], i + lobe));
        if (oleander && lobe > 2) {
          for (let flower = 0; flower < 3; flower++) {
            parts.push(hedgeFoliageLobe([at[0] + (flower - 1) * step * .09, y + top * .14, at[2] + width * .16],
              [step * .09, height * .025, width * .055], flower % 2 ? "#dc8c98" : "#c96d87", flower));
          }
        }
      }
    }
    return mergeHedgeFoliage(parts);
  }, [length, height, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="mixed-laurel-and-oleander" geometry={geometry} castShadow receiveShadow><ToonMaterial vertexColors /></mesh>;
}

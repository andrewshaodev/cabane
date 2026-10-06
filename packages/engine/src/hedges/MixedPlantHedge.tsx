import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { ToonMaterial } from "../rendering";
import { hedgeFoliageLobe, mergeHedgeFoliage } from "./hedge-foliage-geometry";

/** Interleaved broad laurel crowns and slender, flowering oleander sprays. */
export function MixedPlantHedge({
  length,
  height,
  width,
}: {
  length: number;
  height: number;
  width: number;
}) {
  const geometry = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const count = Math.min(90, Math.max(3, Math.ceil(length / (width * 0.55))));
    const step = length / count;
    for (let i = 0; i < count; i++) {
      const x = -length / 2 + (i + 0.5) * step;
      const oleander = i % 3 === 1;
      const top = height * (0.86 + 0.1 * Math.sin(i * 2.7 + 1));
      for (let lobe = 0; lobe < 7; lobe++) {
        const angle = lobe * 2.4 + i;
        const y = top * (0.32 + lobe * 0.075);
        const at = [x + Math.cos(angle) * step * 0.18, y, Math.sin(angle) * width * 0.22] as const;
        parts.push(
          hedgeFoliageLobe(
            at,
            [
              step * (oleander ? 0.48 : 0.68),
              top * (oleander ? 0.24 : 0.2),
              width * (oleander ? 0.22 : 0.3),
            ],
            oleander
              ? ["#507547", "#64834e"][lobe % 2]
              : ["#355c36", "#426c39", "#587e43"][lobe % 3],
            i + lobe,
          ),
        );
        if (oleander && lobe > 2) {
          for (let flower = 0; flower < 3; flower++) {
            parts.push(
              hedgeFoliageLobe(
                [at[0] + (flower - 1) * step * 0.09, y + top * 0.14, at[2] + width * 0.16],
                [step * 0.09, height * 0.025, width * 0.055],
                flower % 2 ? "#dc8c98" : "#c96d87",
                flower,
              ),
            );
          }
        }
      }
    }
    return mergeHedgeFoliage(parts);
  }, [length, height, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="mixed-laurel-and-oleander" geometry={geometry} castShadow receiveShadow>
      <ToonMaterial vertexColors />
    </mesh>
  );
}

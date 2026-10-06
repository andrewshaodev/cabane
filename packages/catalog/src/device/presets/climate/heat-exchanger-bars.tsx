import { useEffect, useMemo } from "react";
import { BoxGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Outlines, ToonMaterial } from "@cabane/engine";

/** One mesh for the repeated physical bars on a radiator or towel rail. */
export function HeatExchangerBars({ horizontal }: { horizontal: boolean }) {
  const geometry = useMemo(() => {
    const bars = Array.from({ length: 8 }, (_, i) => {
      const bar = horizontal
        ? new BoxGeometry(0.54, 0.025, 0.055)
        : new BoxGeometry(0.018, 0.47, 0.016);
      bar.translate(
        horizontal ? 0 : -0.39 + i * 0.112,
        horizontal ? 0.12 + i * 0.145 : 0.31,
        horizontal ? 0.062 : 0.11,
      );
      return bar;
    });
    const merged = mergeGeometries(bars);
    bars.forEach((bar) => bar.dispose());
    return merged;
  }, [horizontal]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow>
      <ToonMaterial color={horizontal ? "#f0eee9" : "#d6d7d2"} />
      {horizontal && <Outlines color="#7d8380" thickness={0.003} />}
    </mesh>
  );
}

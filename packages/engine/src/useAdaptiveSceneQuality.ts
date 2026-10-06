import { useRef, useState } from "react";
import { foregroundRenderingDpr, sceneRenderingQuality } from "./performance";

export function useAdaptiveSceneQuality(coarsePointer: boolean, walkMode: boolean) {
  const [qualityTier, setQualityTier] = useState<0 | 1 | 2>(2);
  const qualityPinned = useRef(false);
  const lastQualityDirection = useRef<"up" | "down" | null>(null);
  const qualityDirectionChanges = useRef(0);
  const quality = sceneRenderingQuality(coarsePointer, walkMode, qualityTier);
  const canvasDpr = walkMode ? quality.dpr : foregroundRenderingDpr(quality);
  const adjustQuality = (direction: "up" | "down") => {
    if (qualityPinned.current) return;
    if (lastQualityDirection.current !== null && lastQualityDirection.current !== direction) {
      qualityDirectionChanges.current += 1;
    }
    lastQualityDirection.current = direction;
    if (qualityDirectionChanges.current >= 3) {
      qualityPinned.current = true;
      setQualityTier(0);
      return;
    }
    setQualityTier((current) =>
      direction === "up"
        ? (Math.min(2, current + 1) as 0 | 1 | 2)
        : (Math.max(0, current - 1) as 0 | 1 | 2),
    );
  };
  return { quality, canvasDpr, adjustQuality };
}

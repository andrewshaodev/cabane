import { useEffect, useRef, useState } from "react";
import type { HomeProject, ManifestIssue, StairSpec } from "@cabane/engine";
import { validateStairCandidate } from "./stair-candidate-validation";

/** Geometry stays immediate; expensive diagnostics trail by at most 100 ms. */
export function useStairValidation(building: HomeProject, candidate: StairSpec | null) {
  const [issues, setIssues] = useState<ManifestIssue[]>([]);
  const latest = useRef({ building, candidate });
  latest.current = { building, candidate };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(-Infinity);
  const cancel = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  const flush = (stair = latest.current.candidate) => {
    cancel();
    last.current = performance.now();
    const result = stair ? validateStairCandidate(latest.current.building, stair) : [];
    setIssues(result);
    return result;
  };
  useEffect(() => {
    const remaining = 100 - (performance.now() - last.current);
    if (remaining <= 0) flush();
    else if (timer.current === null) timer.current = setTimeout(() => flush(), remaining);
  }, [building, candidate]);
  useEffect(() => cancel, []);
  return { issues, flush, cancel };
}

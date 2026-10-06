import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeProject, ManifestIssue, StairSpec } from "@cabane/engine";
import { validateStairCandidate, type StairValidationRegistries } from "./stair-candidate-validation";

const NO_ISSUES: readonly ManifestIssue[] = [];

/** Geometry stays immediate; expensive diagnostics trail by at most 100 ms. */
export function useStairValidation(building: HomeProject, candidate: StairSpec | null, registries?: StairValidationRegistries) {
  const [issues, setIssues] = useState<readonly ManifestIssue[]>(NO_ISSUES);
  const latest = useRef({ building, candidate, registries });
  latest.current = { building, candidate, registries };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(-Infinity);
  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const cancel = useCallback(() => {
    clearTimer();
    last.current = -Infinity;
    setIssues(NO_ISSUES);
  }, [clearTimer]);
  const flush = useCallback((stair = latest.current.candidate) => {
    clearTimer();
    last.current = performance.now();
    const result = stair ? validateStairCandidate(latest.current.building, stair, latest.current.registries) : NO_ISSUES;
    setIssues(result);
    return result;
  }, [clearTimer]);
  useEffect(() => {
    if (!candidate) { cancel(); return; }
    const remaining = 100 - (performance.now() - last.current);
    if (remaining <= 0) flush();
    else if (timer.current === null) timer.current = setTimeout(() => flush(), remaining);
  }, [building, candidate, registries, cancel, flush]);
  useEffect(() => clearTimer, [clearTimer]);
  return { issues: candidate ? issues : NO_ISSUES, flush, cancel };
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  advanceRollUpDoorPositions,
  resolveOpeningPositions,
  type OpeningPositions,
  type RetainedOpeningPositions,
} from "./opening-pose";
import type { FloorSpec, ResolvedHomeBindings } from "./types";

function rollUpPositions(target: OpeningPositions, ids: readonly string[]): OpeningPositions {
  return Object.fromEntries(ids.map((id) => [id, target[id] ?? 0]));
}

/** Keep the rendered slats and Walk clearance on the same moving position. */
export function useAnimatedRollUpDoorPositions(
  floors: readonly FloorSpec[],
  automatic: ReadonlySet<string>,
  bindings: ResolvedHomeBindings["openings"],
  retained: RetainedOpeningPositions,
  reducedMotion: boolean,
): OpeningPositions {
  const target = useMemo(
    () => resolveOpeningPositions(automatic, bindings, retained),
    [automatic, bindings, retained],
  );
  const ids = useMemo(
    () =>
      floors.flatMap((floor) =>
        floor.openings
          .filter((opening) => opening.kind === "door" && opening.operation === "roll-up")
          .map((opening) => opening.id),
      ),
    [floors],
  );
  const [animated, setAnimated] = useState<OpeningPositions>(() => rollUpPositions(target, ids));
  const current = useRef(animated);

  useEffect(() => {
    if (reducedMotion) {
      const immediate = rollUpPositions(target, ids);
      current.current = immediate;
      setAnimated(immediate);
      return;
    }
    let previousTime = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const { positions, moving } = advanceRollUpDoorPositions(
        current.current,
        target,
        ids,
        (time - previousTime) / 1000,
      );
      previousTime = time;
      current.current = positions;
      setAnimated(positions);
      if (moving) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ids, reducedMotion, target]);

  return useMemo(() => ({ ...target, ...animated }), [animated, target]);
}

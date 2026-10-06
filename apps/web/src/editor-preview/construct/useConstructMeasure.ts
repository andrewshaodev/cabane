import { useCallback, useMemo, useReducer } from "react";
import type { FloorCoordinates, PlanPoint } from "@cabane/engine";
import {
  constructMeasurementForState,
  constructMeasurePhase,
  constructMeasureReducer,
  createConstructMeasureState,
} from "./measure-geometry";

export const useConstructMeasure = (coordinates: FloorCoordinates) => {
  const [state, dispatch] = useReducer(
    constructMeasureReducer,
    undefined,
    createConstructMeasureState,
  );
  const phase = constructMeasurePhase(state);
  const measurement = useMemo(
    () => constructMeasurementForState(state, coordinates),
    [coordinates, state],
  );

  return {
    state,
    phase,
    measurement,
    place: useCallback((point: PlanPoint) => dispatch({ type: "place", point }), []),
    preview: useCallback((point: PlanPoint) => dispatch({ type: "preview", point }), []),
    cancel: useCallback(() => dispatch({ type: "cancel" }), []),
    reset: useCallback(() => dispatch({ type: "reset" }), []),
  } as const;
};

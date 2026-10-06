import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { reconcileFloorSelection } from "./floor-selection";

export type FloorSelectionSource = "picker" | "walk" | "target";
interface NavigationState {
  activeFloorId: string;
  wholeBuilding: boolean;
  source: FloorSelectionSource;
  request: number;
}
const initial: NavigationState = {
  activeFloorId: "",
  wholeBuilding: false,
  source: "target",
  request: 0,
};
const useNavigationState = (initialFloorId = "") => {
  const [state, setState] = useState(() => ({ ...initial, activeFloorId: initialFloorId }));
  const views = useRef(new Map<string, unknown>());
  return useMemo(() => ({ state, setState, views }), [state]);
};
const FloorNavigationContext = createContext<ReturnType<typeof useNavigationState> | null>(null);
export function FloorNavigationProvider({
  children,
  initialFloorId,
}: {
  children: ReactNode;
  initialFloorId?: string;
}) {
  const value = useNavigationState(initialFloorId);
  return (
    <FloorNavigationContext.Provider value={value}>{children}</FloorNavigationContext.Provider>
  );
}

/** Standalone fixtures have local state; routed product shares the provider above routes. */
export function useFloorNavigation(floors: readonly { id: string; belowGround?: boolean }[]) {
  const shared = useContext(FloorNavigationContext);
  const local = useNavigationState();
  const { state, setState, views } = shared ?? local;
  const order = floors.map((floor) => floor.id);
  const previousOrder = useRef(order);
  const selected = reconcileFloorSelection(
    state.activeFloorId
      ? state
      : { ...state, activeFloorId: floors.find((floor) => !floor.belowGround)?.id ?? "" },
    previousOrder.current,
    order,
  );
  useEffect(() => {
    previousOrder.current = order;
    if (selected.activeFloorId !== state.activeFloorId)
      setState((value) => ({ ...value, ...selected }));
  }, [order.join("\u0000"), selected.activeFloorId, state.activeFloorId, setState]);
  return {
    ...state,
    ...selected,
    selectFloor: (id: string, source: FloorSelectionSource = "picker") => {
      if (!id) return;
      setState((value) => ({
        activeFloorId: id,
        wholeBuilding: false,
        source,
        request: value.request + (source === "walk" ? 0 : 1),
      }));
    },
    setWholeBuilding: (wholeBuilding: boolean) =>
      setState((value) => ({ ...value, wholeBuilding })),
    views: views.current,
  };
}

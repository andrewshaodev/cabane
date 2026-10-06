import { useCabaneDom } from "./../CabaneDom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

function createRoomHoverStore() {
  let roomId: string | null = null;
  let owner: symbol | null = null;
  const listeners = new Set<() => void>();
  return {
    reset: () => {
      owner = null;
      roomId = null;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => roomId,
    set: (source: symbol, next: string | null) => {
      if (next === null && owner !== source) return;
      owner = next === null ? null : source;
      if (roomId === next) return;
      roomId = next;
      listeners.forEach((listener) => listener());
    },
  };
}
const RoomHoverContext = createContext<ReturnType<typeof createRoomHoverStore> | null>(null);
const emptySubscribe = () => () => {};
const emptySnapshot = () => null;

export function useRoomHoverEnabled() {
  return useContext(RoomHoverContext) !== null;
}

export function useHoveredRoom() {
  const store = useContext(RoomHoverContext);
  return useSyncExternalStore(
    store?.subscribe ?? emptySubscribe,
    store?.getSnapshot ?? emptySnapshot,
    emptySnapshot,
  );
}

export function useRoomHoverTarget() {
  const store = useContext(RoomHoverContext);
  const source = useRef(Symbol("room-hover"));
  useEffect(() => () => store?.set(source.current, null), [store]);
  return useCallback((roomId: string | null) => store?.set(source.current, roomId), [store]);
}

function RoomHoverCursor() {
  const dom = useCabaneDom();
  const hovered = useHoveredRoom() !== null;
  useEffect(() => {
    if (!hovered) return;
    const previous = dom.container.style.cursor;
    dom.container.style.cursor = "pointer";
    return () => {
      dom.container.style.cursor = previous;
    };
  }, [hovered, dom]);
  return null;
}

export function RoomHoverProvider({ children, scope }: { children: ReactNode; scope: string }) {
  const store = useMemo(createRoomHoverStore, []);
  useEffect(() => store.reset(), [store, scope]);
  return (
    <RoomHoverContext.Provider value={store}>
      <RoomHoverCursor />
      {children}
    </RoomHoverContext.Provider>
  );
}

import { events, type RootStore } from "@react-three/fiber";

/** Canvas configuration can finish after React has detached its event element. */
export function connectedCanvasEvents(store: RootStore) {
  const manager = events(store);
  const connect = manager.connect;
  manager.connect = (target) => {
    if (!target?.isConnected) return;
    connect?.(target);
  };
  return manager;
}

import { useCabaneDom } from "@cabane/engine";
import { useEffect } from "react";

/** Scope secondary fire and context-menu suppression to captured desktop gameplay. */
export function usePortalInput(active: boolean, place: () => void) {
  const dom = useCabaneDom();
  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (!active || !dom.root.pointerLockElement || event.button !== 2) return;
      event.preventDefault();
      place();
    };
    const context = (event: Event) => {
      if (active && dom.root.pointerLockElement) event.preventDefault();
    };
    dom.events.addEventListener("pointerdown", pointer);
    dom.events.addEventListener("contextmenu", context);
    return () => {
      dom.events.removeEventListener("pointerdown", pointer);
      dom.events.removeEventListener("contextmenu", context);
    };
  }, [active, dom.events, dom.root, place]);
}

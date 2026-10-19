import { useEffect, useLayoutEffect, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useCabaneDom } from "./CabaneDom";
import type { EntityStateSnapshot, ExtensionInteractionTarget } from "./types";
import { supportsLightBrightness } from "./home-assistant-controls";

type Options = {
  enabled: boolean;
  target: ExtensionInteractionTarget;
  light: EntityStateSnapshot | undefined;
  tapTolerancePixels: number;
  onInteract: (target: ExtensionInteractionTarget) => void;
};
type PointerPosition = Pick<PointerEvent, "pointerId" | "clientX" | "clientY">;
const HOLD_DELAY_MS = 500;
const DIM_INTERVAL_MS = 200;
const DIM_STEP_PERCENT = 5;

/** Track the native pointer so leaving the mesh cannot strand a held dimmer. */
export function useOrbitDevicePress(options: Options) {
  const dom = useCabaneDom();
  const latest = useRef(options);
  const cleanup = useRef<(() => void) | null>(null);
  const press = useRef<{
    move: (pointer: PointerPosition) => void;
    release: (pointer: PointerPosition) => void;
  } | null>(null);
  const direction = useRef(1);
  useLayoutEffect(() => {
    latest.current = options;
  });
  useEffect(
    () => () => cleanup.current?.(),
    [dom, options.enabled, options.target.id, options.target.slotId, options.light?.entityId],
  );

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!options.enabled || event.button > 0 || event.isPrimary === false) return;
    event.stopPropagation();
    cleanup.current?.();
    const { pointerId } = event;
    const { clientX: x, clientY: y } = event.nativeEvent;
    const events = typeof window === "undefined" ? null : dom.events;
    const ownerDocument = typeof document === "undefined" ? null : dom.container.ownerDocument;
    const view = ownerDocument?.defaultView;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let holding = false;
    let active = true;
    let level = options.light?.state === "off" ? 1 : Number(options.light?.attributes.brightness);
    level = Number.isFinite(level) ? Math.max(1, Math.min(100, Math.round(level / 2.55))) : 100;
    let stepDirection = level >= 100 ? -1 : level <= 1 ? 1 : direction.current;

    const cancel = () => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      if (holding) direction.current = -stepDirection;
      events?.removeEventListener("pointermove", move);
      events?.removeEventListener("pointerup", release);
      events?.removeEventListener("pointercancel", cancelPointer);
      events?.removeEventListener("lostpointercapture", cancelPointer);
      events?.removeEventListener("pointerdown", anotherPointer);
      events?.removeEventListener("contextmenu", preventContextMenu);
      view?.removeEventListener("blur", cancel);
      ownerDocument?.removeEventListener("visibilitychange", cancel);
      press.current = null;
      cleanup.current = null;
    };
    const moved = (pointer: PointerPosition) =>
      Math.hypot(pointer.clientX - x, pointer.clientY - y) > latest.current.tapTolerancePixels;
    const move = (pointer: PointerPosition) => {
      if (pointer.pointerId === pointerId && moved(pointer)) cancel();
    };
    const release = (pointer: PointerPosition) => {
      if (pointer.pointerId !== pointerId) return;
      const tap = !holding && !moved(pointer);
      cancel();
      if (tap) {
        const { target, light, onInteract } = latest.current;
        onInteract(light ? { ...target, intent: "light-toggle" } : target);
      }
    };
    const cancelPointer = (pointer: PointerEvent) => {
      if (pointer.pointerId === pointerId) cancel();
    };
    const anotherPointer = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) cancel();
    };
    const preventContextMenu = (event: MouseEvent) => {
      if (options.light && supportsLightBrightness(options.light)) event.preventDefault();
    };
    const dim = () => {
      if (!active) return;
      const { target, light, onInteract } = latest.current;
      if (!light || !supportsLightBrightness(light)) {
        cancel();
        return;
      }
      holding = true;
      level = Math.max(1, Math.min(100, level + stepDirection * DIM_STEP_PERCENT));
      onInteract({ ...target, intent: "light-dim", brightnessPercent: level });
      if (level === 100 || level === 1) stepDirection *= -1;
      timer = setTimeout(dim, DIM_INTERVAL_MS);
    };
    cleanup.current = cancel;
    press.current = { move, release };
    events?.addEventListener("pointermove", move);
    events?.addEventListener("pointerup", release);
    events?.addEventListener("pointercancel", cancelPointer);
    events?.addEventListener("lostpointercapture", cancelPointer);
    events?.addEventListener("pointerdown", anotherPointer);
    events?.addEventListener("contextmenu", preventContextMenu);
    view?.addEventListener("blur", cancel);
    ownerDocument?.addEventListener("visibilitychange", cancel);
    if (options.light && supportsLightBrightness(options.light))
      timer = setTimeout(dim, HOLD_DELAY_MS);
  };
  const position = (event: ThreeEvent<PointerEvent>): PointerPosition => ({
    pointerId: event.pointerId,
    clientX: event.nativeEvent.clientX,
    clientY: event.nativeEvent.clientY,
  });
  return {
    onPointerDown,
    onPointerMove: (event: ThreeEvent<PointerEvent>) => press.current?.move(position(event)),
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      press.current?.release(position(event));
    },
    onPointerCancel: () => cleanup.current?.(),
  };
}

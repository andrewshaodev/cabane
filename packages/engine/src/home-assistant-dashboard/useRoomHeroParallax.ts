import { useLayoutEffect, type RefObject } from "react";

type RoomHeroMotion = {
  photoPercent: number;
  foregroundPixels: number;
  visualOpacity: number;
  foregroundOpacity: number;
};

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));

export const roomHeroParallaxOffsets = (scrollTop: number, travel: number): RoomHeroMotion => {
  const progress = clamp(scrollTop / Math.max(1, travel));
  const foregroundFade = clamp((progress - 0.08) / 0.72);

  return {
    photoPercent: -4 + progress * 8,
    foregroundPixels: progress * 8,
    visualOpacity: 1 - progress * 0.4,
    foregroundOpacity: 1 - foregroundFade,
  };
};

const stationaryRoomHero: RoomHeroMotion = {
  photoPercent: 0,
  foregroundPixels: 0,
  visualOpacity: 1,
  foregroundOpacity: 1,
};

const interpolateMotion = (
  current: RoomHeroMotion,
  target: RoomHeroMotion,
  amount: number,
): RoomHeroMotion => ({
  photoPercent: current.photoPercent + (target.photoPercent - current.photoPercent) * amount,
  foregroundPixels:
    current.foregroundPixels + (target.foregroundPixels - current.foregroundPixels) * amount,
  visualOpacity: current.visualOpacity + (target.visualOpacity - current.visualOpacity) * amount,
  foregroundOpacity:
    current.foregroundOpacity + (target.foregroundOpacity - current.foregroundOpacity) * amount,
});

const motionDistance = (current: RoomHeroMotion, target: RoomHeroMotion) =>
  Math.max(
    Math.abs(target.photoPercent - current.photoPercent),
    Math.abs(target.foregroundPixels - current.foregroundPixels),
    Math.abs(target.visualOpacity - current.visualOpacity),
    Math.abs(target.foregroundOpacity - current.foregroundOpacity),
  );

export const useRoomHeroParallax = ({
  scrollRef,
  heroRef,
  enabled,
  resetKey,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  resetKey: string;
}) => {
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const hero = heroRef.current;
    if (!scroll || !hero || typeof window === "undefined") return;
    const reducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    let frame = 0;
    let lastFrameTime: number | null = null;

    const targetMotion = () =>
      enabled && !reducedMotion?.matches
        ? roomHeroParallaxOffsets(scroll.scrollTop, hero.offsetHeight)
        : stationaryRoomHero;
    let target = targetMotion();
    let current = target;

    const apply = (motion: RoomHeroMotion) => {
      hero.style.setProperty("--room-photo-parallax-y", `${motion.photoPercent}%`);
      hero.style.setProperty("--room-foreground-parallax-y", `${motion.foregroundPixels}px`);
      hero.style.setProperty("--room-hero-visual-opacity", `${motion.visualOpacity}`);
      hero.style.setProperty("--room-foreground-opacity", `${motion.foregroundOpacity}`);
    };
    const animate = (timestamp: number) => {
      frame = 0;
      const deltaSeconds =
        lastFrameTime === null
          ? 1 / 60
          : Math.min(0.05, Math.max(0, (timestamp - lastFrameTime) / 1000));
      lastFrameTime = timestamp;
      const amount = 1 - Math.exp(-10 * deltaSeconds);
      current = interpolateMotion(current, target, amount);

      if (motionDistance(current, target) < 0.001) current = target;
      apply(current);
      if (current !== target) schedule();
      else lastFrameTime = null;
    };
    const schedule = () => {
      if (frame !== 0) return;
      if (typeof window.requestAnimationFrame !== "function") {
        current = target;
        apply(current);
        return;
      }
      frame = window.requestAnimationFrame(animate);
    };
    const updateTarget = () => {
      target = targetMotion();
      if (reducedMotion?.matches || !enabled) {
        current = target;
        apply(current);
        return;
      }
      schedule();
    };

    scroll.addEventListener("scroll", updateTarget, { passive: true });
    reducedMotion?.addEventListener?.("change", updateTarget);
    apply(current);
    return () => {
      scroll.removeEventListener("scroll", updateTarget);
      reducedMotion?.removeEventListener?.("change", updateTarget);
      if (frame !== 0 && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [enabled, heroRef, resetKey, scrollRef]);
};

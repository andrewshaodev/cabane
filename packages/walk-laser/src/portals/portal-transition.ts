import type { WalkToolLanding } from "@cabane/engine";
import type { PortalColor } from "./portal-contract";

export interface PortalTravel {
  landing: WalkToolLanding;
  facing: { yaw: number; pitch: number };
  entry: PortalColor;
  exit: PortalColor;
}

/** Cover one rendered frame before relocation, then reveal the destination. */
export function createPortalTransition() {
  let request: PortalTravel | null = null;
  let phase: "cover" | "commit" | "reveal" = "cover";
  let age = 0;
  let reduced = false;
  let arrived = false;
  const idle = { opacity: 0, fovOffset: 0, ringScale: 1, color: "blue" as PortalColor, reduced: false };
  return {
    get busy() { return request !== null; },
    start(travel: PortalTravel, reducedMotion: boolean) {
      if (request) return false;
      request = travel;
      phase = reducedMotion ? "commit" : "cover";
      age = 0;
      reduced = reducedMotion;
      arrived = false;
      return true;
    },
    cancel() { request = null; },
    advance(delta: number, commit: (travel: PortalTravel) => boolean) {
      if (!request) return idle;
      age += Math.min(.05, Math.max(0, delta));
      if (phase === "commit") {
        arrived = commit(request);
        phase = "reveal";
        age = 0;
      }
      const progress = Math.min(1, age / (phase === "cover" ? .095 : reduced ? .12 : .32));
      const opacity = phase === "cover" ? progress * progress * (3 - 2 * progress) : (1 - progress) ** 3;
      const sample = {
        opacity: opacity * (reduced ? .18 : 1),
        fovOffset: reduced ? 0 : 3 * opacity,
        ringScale: phase === "cover" ? 1.2 - .4 * progress : .8 + .8 * progress,
        color: arrived ? request.exit : request.entry,
        reduced,
      };
      if (progress === 1) {
        if (phase === "cover") { phase = "commit"; age = 0; }
        else request = null;
      }
      return sample;
    },
  };
}

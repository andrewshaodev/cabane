import { otherPortal, type PortalAnchor, type PortalColor, type PortalPair } from "./portal-contract";
import { portalsOverlap } from "./portal-placement";

/** Only successful, non-overlapping placements advance the alternating color. */
export function createPortalPair(initial: PortalPair = {}, nextColor: PortalColor = "blue") {
  let pair: PortalPair = initial;
  let next: PortalColor = nextColor;
  return {
    get current() { return pair; },
    get nextColor() { return next; },
    place(anchor: PortalAnchor | null): PortalPair | null {
      if (!anchor) return null;
      const other = pair[otherPortal(next)];
      if (other && portalsOverlap(anchor, other)) return null;
      pair = { ...pair, [next]: anchor };
      next = otherPortal(next);
      return pair;
    },
  };
}

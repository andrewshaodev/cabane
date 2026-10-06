import { PORTAL_COLORS, type PortalColor } from "./portals/portal-contract";
import "./LaserCrosshair.css";

/** Desktop fire bindings stay beside the aim point, using symbols instead of labels. */
export function LaserCrosshair({ target, desktop, ready, nextPortal }: {
  target: boolean; desktop: boolean; ready: boolean; nextPortal: PortalColor;
}) {
  return <div className="walk-laser-crosshair" data-ready={ready} role="img"
    aria-label={desktop ? `Left click: zap. Right click: ${nextPortal} portal.` : "Zap crosshair"}>
    {desktop && <div className="walk-laser-crosshair__action" data-action="zap" style={{ color: "#51e8f3" }} aria-hidden="true">
      <svg className="walk-laser-crosshair__ability" viewBox="0 0 24 24">
        <path d="M14 2 5 13h6l-1 9 9-12h-6z" />
      </svg>
      <MouseButton side="left" />
    </div>}
    <svg className="walk-laser__sight" data-target={target} aria-hidden="true" viewBox="0 0 32 32">
      <path className="walk-laser__ticks" d="M16 3v6 M16 23v6 M3 16h6 M23 16h6" />
      <path className="walk-laser__lock" d="M7 11V7h4 M21 7h4v4 M25 21v4h-4 M11 25H7v-4" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </svg>
    {desktop && <div className="walk-laser-crosshair__action" data-action="portal" data-next-portal={nextPortal}
      style={{ color: PORTAL_COLORS[nextPortal] }} aria-hidden="true">
      <svg className="walk-laser-crosshair__ability" viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="6.5" ry="10" transform="rotate(18 12 12)" />
        <path d="M13 5c-4 2-6 10-3 14M11 2l2 3 3-1M8 20l3-1 2 3" />
      </svg>
      <MouseButton side="right" />
    </div>}
  </div>;
}

function MouseButton({ side }: { side: "left" | "right" }) {
  return <svg className="walk-laser-crosshair__mouse" viewBox="0 0 16 22">
    <path d={side === "left" ? "M8 2H6a4 4 0 0 0-4 4v4h6z" : "M8 2h2a4 4 0 0 1 4 4v4H8z"}
      fill="currentColor" stroke="none" />
    <rect x="2" y="2" width="12" height="18" rx="5" />
    <path d="M8 2v8M2 10h12" />
  </svg>;
}

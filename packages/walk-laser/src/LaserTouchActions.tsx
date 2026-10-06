import { PORTAL_COLORS, type PortalColor } from "./portals/portal-contract";
import "./LaserTouchActions.css";

/** Fire on contact, independently of a second finger steering either joystick. */
export function LaserTouchActions({
  ready,
  nextPortal,
  zap,
  portal,
}: {
  ready: boolean;
  nextPortal: PortalColor;
  zap: () => void;
  portal: () => void;
}) {
  return (
    <div className="walk-laser-touch" role="group" aria-label="Gun actions">
      {(["zap", "portal"] as const).map((action) => (
        <button
          key={action}
          type="button"
          className="walk-laser-touch__action"
          data-action={action}
          disabled={!ready}
          aria-label={action === "zap" ? "Fire zap" : `Create ${nextPortal} portal`}
          style={{ color: action === "zap" ? "#51e8f3" : PORTAL_COLORS[nextPortal] }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            (action === "zap" ? zap : portal)();
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (event.detail === 0) (action === "zap" ? zap : portal)();
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {action === "zap" ? (
              <path d="M14 2 5 13h6l-1 9 9-12h-6z" />
            ) : (
              <>
                <ellipse cx="12" cy="12" rx="6.5" ry="10" transform="rotate(18 12 12)" />
                <path d="M13 5c-4 2-6 10-3 14M11 2l2 3 3-1M8 20l3-1 2 3" />
              </>
            )}
          </svg>
        </button>
      ))}
    </div>
  );
}

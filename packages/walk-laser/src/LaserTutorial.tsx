import { useCabaneDom } from "@cabane/engine";
import { useCallback, useEffect, useState } from "react";
import { LaserIcon } from "./LaserIcon";
import "./LaserTutorial.css";

const STORAGE_KEY = "cabane.walk-laser.tutorial.v1";
let dismissedThisSession = false;

function hasDismissed() {
  if (dismissedThisSession) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}

/** A browser-local introduction, independent of the home's portable portal data. */
export function LaserTutorial({ coarsePointer }: { coarsePointer: boolean }) {
  const dom = useCabaneDom();
  const [dismissed, setDismissed] = useState(hasDismissed);
  const dismiss = useCallback(() => {
    dismissedThisSession = true;
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // Keep dismissal for this session when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const keydown = (event: KeyboardEvent) => {
      if (
        event.code !== "Enter" ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !dom.root.pointerLockElement
      )
        return;
      event.preventDefault();
      dismiss();
    };
    dom.events.addEventListener("keydown", keydown);
    return () => dom.events.removeEventListener("keydown", keydown);
  }, [dismiss, dismissed, dom.events, dom.root]);

  if (dismissed) return null;
  return (
    <section
      className="walk-laser-tutorial"
      aria-label="How to use the gun"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="walk-laser-tutorial__heading">
        <LaserIcon />
        <div>
          <h2>Pew pew!</h2>
          <p>Your home, a little more playful.</p>
        </div>
      </div>
      <p>
        <strong>Toggle lights.</strong> Aim at a connected light, then{" "}
        {coarsePointer ? "tap the lightning button" : "left-click or press F"} to turn it on or off.
      </p>
      <p>
        <strong>Make a shortcut.</strong> Aim at a clear wall and{" "}
        {coarsePointer ? "tap the portal button" : "right-click"} to place a portal. Place a second
        portal elsewhere, then walk into either one to travel between them.
      </p>
      <p>Put the pair in spots you visit often. Zap a portal to remove it.</p>
      <button type="button" onClick={dismiss}>
        {coarsePointer ? "Got it" : "Got it · Enter"}
      </button>
    </section>
  );
}

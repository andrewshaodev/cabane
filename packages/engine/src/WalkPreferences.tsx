import { useCabaneDom } from "./CabaneDom";
import { useEffect, useRef } from "react";
import type { SolarLightingMode } from "./lighting";

export const WALK_PREFERENCES_KEY = "cabane.walk.preferences.v1";

function loadPreferences(): Record<string, unknown> {
  try {
    const value = JSON.parse(window.localStorage.getItem(WALK_PREFERENCES_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function savePreferences(next: Record<string, unknown>): void {
  try { window.localStorage.setItem(WALK_PREFERENCES_KEY, JSON.stringify(next)); }
  catch { /* Keep the current session setting when storage is unavailable. */ }
}

export function loadInvertYAxis(): boolean {
  return loadPreferences().invertYAxis === true;
}

export function saveInvertYAxis(value: boolean): void {
  savePreferences({ ...loadPreferences(), invertYAxis: value });
}

export function loadLightingMode(): SolarLightingMode {
  const mode = loadPreferences().lightingMode;
  return mode === "day" || mode === "night" ? mode : "live";
}

export function saveLightingMode(mode: SolarLightingMode): void {
  savePreferences({ ...loadPreferences(), lightingMode: mode });
}

export function WalkPreferences({ inverted, onChange, lightingMode, onLightingModeChange, onClose }: {
  inverted: boolean;
  onChange: (value: boolean) => void;
  lightingMode: SolarLightingMode;
  onLightingModeChange: (mode: SolarLightingMode) => void;
  onClose: () => void;
}) {
  const dom = useCabaneDom();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = dom.root.activeElement instanceof HTMLElement ? dom.root.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === "Tab") {
        const focusable = Array.from(dom.root.querySelectorAll<HTMLElement>(".walk-preferences button, .walk-preferences input"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && dom.root.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && dom.root.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    dom.events.addEventListener("keydown", onKeyDown, true);
    return () => { dom.events.removeEventListener("keydown", onKeyDown, true); previousFocus?.focus(); };
  }, [onClose]);
  return <div className="walk-preferences-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="walk-preferences" role="dialog" aria-modal="true" aria-labelledby="walk-preferences-title">
      <header>
        <div><h2 id="walk-preferences-title">Preferences</h2><p>Make exploring feel natural to you.</p></div>
        <button ref={closeRef} type="button" className="walk-preferences__close" aria-label="Close preferences" onClick={onClose}>×</button>
      </header>
      <div className="walk-preferences__group">
        <h3>Look controls</h3>
        <label className="walk-preferences__row">
          <span><strong>Invert Y axis</strong><small>Move down to look up while walking or exploring.</small></span>
          <input type="checkbox" checked={inverted} onChange={event => onChange(event.target.checked)} />
          <span className="walk-preferences__switch" aria-hidden="true" />
        </label>
      </div>
      <div className="walk-preferences__group">
        <h3>Lighting</h3>
        <fieldset className="walk-preferences__choices">
          <legend>Time of day</legend>
          {([ ["day", "Always day"], ["night", "Always night"], ["live", "Auto"] ] as const).map(([mode, label]) =>
            <label key={mode}>
              <input type="radio" name="walk-lighting-mode" value={mode} checked={lightingMode === mode}
                onChange={() => onLightingModeChange(mode)} />
              <span>{label}</span>
            </label>)}
        </fieldset>
        <p className="walk-preferences__hint">Auto follows the sun when available, then your local time.</p>
      </div>
    </section>
  </div>;
}

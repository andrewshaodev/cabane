import { useEffect, useRef } from "react";

export const WALK_PREFERENCES_KEY = "cabane.walk.preferences.v1";

export function loadInvertYAxis(): boolean {
  try { return JSON.parse(window.localStorage.getItem(WALK_PREFERENCES_KEY) ?? "{}").invertYAxis === true; }
  catch { return false; }
}

export function saveInvertYAxis(value: boolean): void {
  try { window.localStorage.setItem(WALK_PREFERENCES_KEY, JSON.stringify({ invertYAxis: value })); }
  catch { /* The preference remains usable for this session. */ }
}

export function WalkPreferences({ inverted, onChange, onClose }: {
  inverted: boolean;
  onChange: (value: boolean) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(".walk-preferences button, .walk-preferences input"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => { document.removeEventListener("keydown", onKeyDown, true); previousFocus?.focus(); };
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
      <p className="walk-preferences__footnote">Saved in this browser.</p>
    </section>
  </div>;
}

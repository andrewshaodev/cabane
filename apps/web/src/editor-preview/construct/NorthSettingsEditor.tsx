import { useState } from "react";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import { SidebarSectionSummary } from "../../editor-chrome/SidebarSectionSummary";

export function NorthSettingsEditor({
  value,
  onChange,
}: {
  value: number;
  onChange: (angle: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const angle = draft ?? value;
  const commit = (next: number) => {
    setDraft(null);
    onChange(((next % 360) + 360) % 360);
  };
  return (
    <details className="construction-inspector__floor-disclosure">
      <SidebarSectionSummary
        icon="spawn"
        title="North"
        description="Orient sunlight for the whole building."
      />
      <section
        className="construction-inspector__floor-settings sidebar-section-content"
        aria-label="North orientation"
      >
        <svg
          viewBox="0 0 100 100"
          width="80"
          height="80"
          role="img"
          aria-label={`North points ${angle} degrees clockwise from plan up`}
        >
          <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" opacity="0.25" />
          <g transform={`rotate(${angle} 50 50)`}>
            <path d="M50 22 L40 62 L50 55 L60 62 Z" fill="currentColor" />
            <text
              x="50"
              y="17"
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              transform={`rotate(${-angle} 50 17)`}
            >
              N
            </text>
          </g>
        </svg>
        <label>
          North angle (°)
          <CommittedNumberInput
            label="North angle (degrees)"
            value={value}
            step={1}
            onCommit={commit}
          />
        </label>
        <input
          style={{ accentColor: "var(--preview-accent)" }}
          aria-label="Rotate north"
          type="range"
          min="0"
          max="359"
          step="1"
          value={angle}
          onChange={(event) => setDraft(Number(event.target.value))}
          onPointerUp={(event) => commit(Number(event.currentTarget.value))}
          onKeyUp={(event) => {
            if (
              event.key.startsWith("Arrow") ||
              ["Home", "End", "PageUp", "PageDown"].includes(event.key)
            )
              commit(Number(event.currentTarget.value));
          }}
          onBlur={() => {
            if (draft !== null) commit(draft);
          }}
          onPointerCancel={() => setDraft(null)}
        />
        <p className="sidebar-section-note">
          0° points up the plan; 90° points right. Set this to your home's geographic north.
        </p>
      </section>
    </details>
  );
}

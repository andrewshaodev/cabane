import { useRef } from "react";
import type { ManifestIssue, StairShape } from "@cabane/engine";
import { StairWarnings } from "./StairWarnings";
import { EditorButton } from "../editor-chrome/EditorButton";
import { ModelThumbnail, ModelThumbnailRenderer } from "../editor-preview/furnish/catalog/ModelThumbnailRenderer";
import { stairPreviewEntries } from "./stair-preview-entries";
import "../editor-preview/furnish/catalog/arrange-catalog.css";
import "../editor-preview/construct/door-preset-palette.css";

export function StairPlacementPanel({ shape, issues = [], onChange, onCancel }: {
  shape: StairShape; issues?: readonly ManifestIssue[]; onChange: (shape: StairShape) => void; onCancel: () => void;
}) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  return <section className="construction-inspector__selection" aria-label="Staircase">
    <header><h3>Staircase</h3></header>
    <ModelThumbnailRenderer scrollRoot={scrollRoot} enabled>
      <div className="floor-finish-palette__grid door-preset-palette__grid" ref={scrollRoot} role="group" aria-label="Stair shape">
        {stairPreviewEntries.map(({ shape: value, label, entry }) => <button type="button" key={value}
          aria-label={label} aria-pressed={shape === value} onClick={() => onChange(value)}>
          <ModelThumbnail entry={entry} showAdd={false} fallback={<span>Preview unavailable</span>} />
          <small>{label}</small>
        </button>)}
      </div>
    </ModelThumbnailRenderer>
    <p className="construction-inspector__tool-hint" role="status">{shape === "spiral"
      ? "Click the center, then the outer edge to set diameter and rotation. Escape cancels."
      : shape === "l-shaped" ? "Click the bottom, landing center, then the upper endpoint. Escape cancels."
        : "Drag from bottom to top, or click each endpoint. Escape cancels."}</p>
    <StairWarnings issues={issues} compact />
    <EditorButton variant="text" onClick={onCancel}>Cancel stairs</EditorButton>
  </section>;
}

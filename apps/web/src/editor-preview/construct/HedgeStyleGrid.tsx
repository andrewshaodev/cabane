import { HEDGE_STYLES, HedgeModel, type HedgeStyle } from "@cabane/engine";
import { useRef } from "react";
import { ModelThumbnail, ModelThumbnailRenderer } from "../furnish/catalog/ModelThumbnailRenderer";
import type { ModelPreviewEntry } from "../furnish/catalog/model-preview-entry";
import "../furnish/catalog/arrange-catalog.css";
import "./hedge-style-grid.css";

const entries = HEDGE_STYLES.map((style) => ({
  style,
  entry: {
    key: `hedge:${style.id}:v2`,
    kind: "procedural",
    definition: {
      bounds: {
        min: [-1.65, 0, -style.widthMeters * 0.65],
        max: [1.65, style.heightMeters * 1.1, style.widthMeters * 0.65],
      },
      component: () => (
        <HedgeModel
          style={style.id}
          length={3}
          height={style.heightMeters}
          width={style.widthMeters}
        />
      ),
    },
  } satisfies ModelPreviewEntry,
}));

export function HedgeStyleGrid({
  value,
  onChoose,
}: {
  value: HedgeStyle;
  onChoose: (style: (typeof HEDGE_STYLES)[number]) => void;
}) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  return (
    <ModelThumbnailRenderer scrollRoot={scrollRoot} enabled>
      <div
        className="catalog-grid hedge-style-grid"
        ref={scrollRoot}
        role="group"
        aria-label="Hedge styles"
      >
        {entries.map(({ style, entry }) => (
          <button
            type="button"
            key={style.id}
            className="catalog-card"
            aria-label={style.label}
            aria-pressed={value === style.id}
            onClick={() => onChoose(style)}
          >
            <ModelThumbnail entry={entry} showAdd={false} />
            <strong>{style.label}</strong>
            <small>{style.description}</small>
          </button>
        ))}
      </div>
    </ModelThumbnailRenderer>
  );
}

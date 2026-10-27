import { useState } from "react";
import type {
  DeviceModelRegistry,
  FloorSpec,
  FurnishingModelRegistry,
  SceneItemSpec,
} from "@cabane/engine";
import { EditorIcon } from "../../editor-chrome/EditorIcon";
import { missingModelEditorDescriptor } from "./missing-model";
import "./arrange-placed-items.css";

/** Uses stored items, independent of visibility, picking and catalog availability. */
export function ArrangePlacedItems({
  floor,
  items,
  furnishingModels,
  deviceModels,
  selectedIds,
  disabled,
  onSelect,
}: {
  floor: Pick<FloorSpec, "id" | "name">;
  items: readonly SceneItemSpec[];
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  selectedIds: readonly string[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const entries = items
    .filter((item) => item.floorId === floor.id)
    .map((item) => ({
      item,
      label:
        (item.kind === "device" ? deviceModels : furnishingModels)[item.modelId]?.label ??
        missingModelEditorDescriptor(item).label,
    }));
  const words = query.trim().toLocaleLowerCase().split(/\s+/);
  const results = entries.filter(({ item, label }) =>
    words.every((word) => `${label} ${item.id}`.toLocaleLowerCase().includes(word)),
  );
  return (
    <details className="arrange-placed-items">
      <summary>Placed items · {entries.length}</summary>
      <p>{floor.name} · Select an item to open Properties, even when it is hidden.</p>
      <label className="catalog-search">
        <EditorIcon name="search" />
        <input
          type="search"
          aria-label="Search placed items"
          placeholder="Search placed items…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul aria-label={`Placed items on ${floor.name}`}>
        {results.map(({ item, label }) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled}
              aria-pressed={selectedIds.includes(item.id)}
              aria-controls="editor-properties"
              onClick={() => onSelect(item.id)}
            >
              <EditorIcon name={item.kind === "device" ? "devices" : "furnish"} />
              <span>
                <strong>{label}</strong>
                <small>{item.id}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <p role="status">
          {entries.length ? "No matching placed items" : "No items on this floor yet"}
        </p>
      )}
    </details>
  );
}

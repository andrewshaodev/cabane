import { useState } from "react";
import { roomIdForItem, roomsForFloor } from "@cabane/engine";
import type {
  DeviceModelRegistry,
  FloorSpec,
  FurnishingModelRegistry,
  SceneItemSpec,
} from "@cabane/engine";
import { EditorIcon } from "../../editor-chrome/EditorIcon";
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
  floor: FloorSpec;
  items: readonly SceneItemSpec[];
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  selectedIds: readonly string[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const rooms = roomsForFloor(floor);
  const entries = items
    .filter((item) => item.floorId === floor.id)
    .map((item) => {
      let roomId: string | null = null;
      try {
        roomId = roomIdForItem(
          item,
          floor,
          (item.kind === "device" ? deviceModels : furnishingModels)[item.modelId],
        );
      } catch {
        // Invalid supports must not prevent selecting an item to repair it.
      }
      return {
        item,
        roomId,
        label:
          (item.kind === "device" ? deviceModels : furnishingModels)[item.modelId]?.label ??
          "Missing model",
      };
    });
  const words = query.trim().toLocaleLowerCase().split(/\s+/);
  const groups = [
    ...rooms.map((room) => ({ id: room.id, label: room.name })),
    { id: null, label: "Outside rooms" },
  ]
    .map((group) => ({
      ...group,
      entries: entries.filter(
        ({ roomId, label }) =>
          roomId === group.id &&
          words.every((word) => `${label} ${group.label}`.toLocaleLowerCase().includes(word)),
      ),
    }))
    .filter((group) => group.entries.length > 0);
  return (
    <details className="arrange-placed-items">
      <summary>Placed items · {entries.length}</summary>
      <p>{floor.name}</p>
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
      <div className="arrange-placed-items__groups" aria-label={`Placed items on ${floor.name}`}>
        {groups.map((group) => (
          <section key={group.id ?? "outside-rooms"}>
            <h3>{group.label}</h3>
            <ul aria-label={group.label}>
              {group.entries.map(({ item, label }) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selectedIds.includes(item.id)}
                    aria-controls="editor-properties"
                    onClick={() => onSelect(item.id)}
                  >
                    <EditorIcon name={item.kind === "device" ? "devices" : "furnish"} />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {groups.length === 0 && (
        <p role="status">
          {entries.length ? "No matching placed items" : "No items on this floor yet"}
        </p>
      )}
    </details>
  );
}

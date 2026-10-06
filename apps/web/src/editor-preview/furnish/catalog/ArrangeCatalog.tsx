import { EditorButton } from "../../../editor-chrome/EditorButton";
import { ROOM_TYPES, type DeviceModelRegistry, type FurnishingModelRegistry } from "@cabane/engine";
import { useMemo, useRef, type ReactNode } from "react";
import { EditorIcon, type EditorIconName } from "../../../editor-chrome/EditorIcon";
import { catalogEntries, filterCatalog, type CatalogEntry, type CatalogRoom } from "./catalog";
import { ModelThumbnail, ModelThumbnailRenderer } from "./ModelThumbnailRenderer";
import "./arrange-catalog.css";

const roomIcons: Record<CatalogRoom, EditorIconName> = {
  all: "grid",
  devices: "devices",
  "my-models": "cube",
  "living-room": "furnish",
  kitchen: "kitchen",
  bedroom: "bed",
  bathroom: "bath",
  "dining-room": "dining",
  office: "monitor",
  entryway: "door",
  hallway: "hallway",
  laundry: "laundry",
  outdoor: "outdoor",
};
const rooms = [{ id: "all" as const, label: "All items" }, ...ROOM_TYPES];
const filters = [
  ...rooms,
  { id: "devices" as const, label: "Devices" },
  { id: "my-models" as const, label: "My models" },
];

export interface CatalogBrowsing {
  room: CatalogRoom;
  query: string;
}

export function ArrangeCatalog({
  furnishingModels,
  deviceModels,
  browsing,
  onBrowse,
  error,
  onChoose,
  enabled = true,
  customModels,
}: {
  enabled?: boolean;
  customModels?: ReactNode;
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  browsing: CatalogBrowsing;
  onBrowse: (next: CatalogBrowsing) => void;
  error?: string | null;
  onChoose: (entry: CatalogEntry) => void;
}) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  const entries = useMemo(
    () => catalogEntries(furnishingModels, deviceModels),
    [furnishingModels, deviceModels],
  );
  const results = useMemo(
    () => filterCatalog(entries, browsing.room, browsing.query),
    [entries, browsing],
  );
  const filterLabel = filters.find((filter) => filter.id === browsing.room)?.label ?? "All items";
  const chooseFilter = (room: CatalogRoom) => {
    onBrowse({ room, query: "" });
    if (scrollRoot.current) scrollRoot.current.scrollTop = 0;
  };
  return (
    <div className="arrange-catalog" aria-label="Item catalog">
      {error && (
        <p className="catalog-add-error" role="alert">
          {error}
        </p>
      )}
      <div className="arrange-catalog__body">
        <nav className="catalog-rooms" aria-label="Catalog room types">
          {rooms.map((room) => (
            <button
              type="button"
              key={room.id}
              aria-pressed={browsing.room === room.id}
              onClick={() => chooseFilter(room.id)}
            >
              <EditorIcon name={roomIcons[room.id]} />
              <span>{room.label}</span>
            </button>
          ))}
          <div className="catalog-device-filter">
            <button
              type="button"
              aria-pressed={browsing.room === "my-models"}
              onClick={() => chooseFilter("my-models")}
            >
              <EditorIcon name="cube" />
              <span>My models</span>
            </button>
            <button
              type="button"
              aria-pressed={browsing.room === "devices"}
              onClick={() => chooseFilter("devices")}
            >
              <EditorIcon name="devices" />
              <span>Devices</span>
            </button>
          </div>
        </nav>
        <div className="catalog-results">
          <label className="catalog-room-select">
            <span>Filter</span>
            <select
              value={browsing.room}
              onChange={(event) => chooseFilter(event.target.value as CatalogRoom)}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          {browsing.room === "my-models" && customModels}
          <div className="catalog-search">
            <EditorIcon name="search" />
            <input
              type="search"
              aria-label={`Search ${filterLabel.toLowerCase()}`}
              value={browsing.query}
              placeholder={`Search ${filterLabel.toLowerCase()}…`}
              onChange={(event) => onBrowse({ ...browsing, query: event.target.value })}
            />
            {browsing.query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onBrowse({ ...browsing, query: "" })}
              >
                <EditorIcon name="close" />
              </button>
            )}
          </div>
          <ModelThumbnailRenderer scrollRoot={scrollRoot} enabled={enabled}>
            <div className="catalog-grid" ref={scrollRoot} aria-label={`${filterLabel} catalog`}>
              {results.map((entry) => (
                <button
                  type="button"
                  className="catalog-card"
                  key={entry.key}
                  aria-label={`Add ${entry.definition.label}`}
                  disabled={
                    entry.kind === "device" && entry.definition.supportedDomains.length === 0
                  }
                  onClick={() => onChoose(entry)}
                >
                  <ModelThumbnail entry={entry} />
                  <strong>{entry.definition.label}</strong>
                  <small>{entry.kind === "device" ? "Device" : "Furniture"}</small>
                </button>
              ))}
              {results.length === 0 && (
                <div className="catalog-empty" role="status">
                  <p>
                    {browsing.query.trim()
                      ? "No matching items"
                      : browsing.room === "my-models"
                        ? "Your models will appear here. Import one or create one with your AI."
                        : "No items for this room type yet"}
                  </p>
                  {(browsing.query.trim() || browsing.room !== "my-models") && (
                    <EditorButton
                      onClick={() =>
                        browsing.query.trim()
                          ? onBrowse({ ...browsing, query: "" })
                          : chooseFilter("all")
                      }
                    >
                      {browsing.query.trim() ? "Clear search" : "Browse all items"}
                    </EditorButton>
                  )}
                </div>
              )}
            </div>
          </ModelThumbnailRenderer>
        </div>
      </div>
    </div>
  );
}

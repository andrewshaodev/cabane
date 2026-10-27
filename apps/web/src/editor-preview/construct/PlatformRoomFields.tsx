import type { OutdoorPlatformSpec } from "@cabane/engine";

export function PlatformRoomFields({
  platform,
  onChange,
}: {
  platform: OutdoorPlatformSpec;
  onChange: (changes: Partial<Omit<OutdoorPlatformSpec, "id">>) => void;
}) {
  return (
    <fieldset>
      <legend>Room</legend>
      <label className="construction-inspector__check">
        <input
          type="checkbox"
          checked={platform.useAsRoom ?? false}
          onChange={(event) =>
            onChange({
              useAsRoom: event.target.checked,
              ...(event.target.checked
                ? { roomName: platform.roomName?.trim() || "Outdoor room" }
                : {}),
            })
          }
        />
        Use as room
      </label>
      {platform.useAsRoom && (
        <label>
          Room name
          <input
            key={`${platform.id}:${platform.roomName}`}
            aria-label="Outdoor room name"
            defaultValue={platform.roomName ?? ""}
            maxLength={80}
            onBlur={(event) => {
              const name = event.currentTarget.value.trim();
              if (name && name !== platform.roomName) onChange({ roomName: name });
              else event.currentTarget.value = platform.roomName ?? "";
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") event.currentTarget.value = platform.roomName ?? "";
              if (event.key === "Enter" || event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      )}
      <p className="construction-inspector__tool-hint">
        Link this outdoor room to a Home Assistant area in Connect. It stays open to the sky.
      </p>
    </fieldset>
  );
}

import type { OutdoorPlatformEdgeConfiguration } from "@cabane/engine";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import { PlatformEdgePalette } from "./PlatformEdgePalette";

export function PlatformEdgeFields({
  value,
  onChange,
}: {
  value: OutdoorPlatformEdgeConfiguration;
  onChange: (value: OutdoorPlatformEdgeConfiguration) => void;
}) {
  return (
    <div className="platform-edge-fields">
      <PlatformEdgePalette value={value} onChange={onChange} />
      {value.kind !== "open" && (
        <label>
          Barrier height (m)
          <CommittedNumberInput
            label="Platform barrier height"
            value={value.heightMeters}
            step={0.1}
            min={0.01}
            onCommit={(heightMeters) => {
              if (heightMeters > 0) onChange({ ...value, heightMeters });
            }}
          />
        </label>
      )}
    </div>
  );
}

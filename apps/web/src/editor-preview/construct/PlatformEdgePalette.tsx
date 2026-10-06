import { OUTDOOR_PLATFORM_EDGE_PRESETS, PlatformBarrierModel, ToonMaterial, type OutdoorPlatformEdgeConfiguration } from "@cabane/engine";
import { useRef } from "react";
import { ModelThumbnail, ModelThumbnailRenderer } from "../furnish/catalog/ModelThumbnailRenderer";
import type { ModelPreviewEntry } from "../furnish/catalog/model-preview-entry";
import "./door-preset-palette.css";
const entries = OUTDOOR_PLATFORM_EDGE_PRESETS.map(preset => {
  const entry: ModelPreviewEntry = { kind: "procedural", key: `platform-edge-v1:${preset.id}`, definition: {
    bounds: { min: [-1,-.16,-.3], max: [1,1,.3] },
    component: ()=><group><mesh position={[0,-.08,0]}><boxGeometry args={[2,.16,.6]} /><ToonMaterial color="#d4c6ae" /></mesh>
      <PlatformBarrierModel from={[-1,0]} to={[1,0]} configuration={preset.configuration} />
    </group>,
  } };
  return { preset, entry };
});
export function PlatformEdgePalette({ value, onChange }: { value: OutdoorPlatformEdgeConfiguration; onChange: (value: OutdoorPlatformEdgeConfiguration)=>void }) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  return <section className="door-preset-palette" aria-label="Platform edge style">
    <ModelThumbnailRenderer scrollRoot={scrollRoot} enabled>
      <div className="floor-finish-palette__grid door-preset-palette__grid" ref={scrollRoot} role="group" aria-label="Platform edge presets">
        {entries.map(({preset,entry})=><button type="button" key={preset.id} aria-label={preset.name} aria-pressed={value.kind===preset.id} onClick={()=>onChange({...preset.configuration})}>
          <ModelThumbnail entry={entry} showAdd={false} fallback={<span>Preview unavailable</span>} /><small>{preset.name}</small>
        </button>)}
      </div>
    </ModelThumbnailRenderer>
  </section>;
}

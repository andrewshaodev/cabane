import { mapPoolOutline, polygonSignedArea, type OutdoorPlatformSpec, type OutdoorPlatformEdgeConfiguration } from "@cabane/engine";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import { FloorFinishPalette } from "./FloorFinishPalette";
import { PlatformEdgePalette } from "./PlatformEdgePalette";
import type { ConstructEditorController } from "./useConstructEditor";
function EdgeFields({value,onChange}:{value:OutdoorPlatformEdgeConfiguration;onChange:(value:OutdoorPlatformEdgeConfiguration)=>void}) {
  return <><PlatformEdgePalette value={value} onChange={onChange} />{value.kind!=="open" && <label>Barrier height (m)<CommittedNumberInput label="Platform barrier height" value={value.heightMeters} step={.1} min={.01} onCommit={heightMeters=>{if(heightMeters>0)onChange({...value,heightMeters});}} /></label>}</>;
}
export function PlatformDrawingProperties({editor}:{editor:ConstructEditorController}) {
  const settings=editor.platformSettings;
  return <div className="construction-inspector__selection">
    <header><div><small>Floor tool</small><strong>Outdoor platform</strong></div></header>
    <p className="construction-inspector__tool-hint">Click corners and return to the first corner to close the platform. Exposed edges use this style. House walls and doorways stay clear.</p>
    <EdgeFields value={settings.defaultEdge} onChange={defaultEdge=>editor.setPlatformSettings({...settings,defaultEdge})} />
    <FloorFinishPalette value={settings.finish} onChange={finish=>editor.setPlatformSettings({...settings,finish})} target="outdoor-platform" showTarget={false} onTargetChange={()=>{}} />
    {editor.poolDrawing.error && <p role="alert">{editor.poolDrawing.error}</p>}
    <button type="button" onClick={()=>{editor.poolDrawing.cancel();editor.setTool("floor");}}>Cancel platform</button>
  </div>;
}
export function PlatformProperties({platform,editor}:{platform:OutdoorPlatformSpec;editor:ConstructEditorController}) {
  const edge=platform.edges.find(edge=>edge.id===editor.selectedPlatformEdgeId);
  const updateEdge=(configuration:OutdoorPlatformEdgeConfiguration)=>editor.updatePlatform(platform.id,{edges:platform.edges.map(e=>e.id===edge?.id?{...e,configuration}:e)});
  const area=Math.abs(polygonSignedArea(platform.polygon))*editor.draft.coordinates.metersPerPlanUnit**2;
  return <div className="construction-inspector__selection">
    <header><div><small>Selected outdoor platform</small><strong>{edge ? `Edge ${platform.edges.indexOf(edge)+1}` : "Platform outline"}</strong></div></header>
    <p>{area.toFixed(1)} m² · Drag the platform to move it, or a corner to reshape it. Select an edge to change its style.</p>
    <label>Edge<select aria-label="Platform edge" value={edge?.id??""} onChange={event=>event.target.value?editor.selectPlatformEdge(platform.id,event.target.value):editor.selectPlatform(platform.id)}>
      <option value="">Default for all edges</option>{platform.edges.map((e,i)=><option key={e.id} value={e.id}>Edge {i+1}</option>)}
    </select></label>
    <EdgeFields value={edge?.configuration??platform.defaultEdge} onChange={edge?updateEdge:defaultEdge=>editor.updatePlatform(platform.id,{defaultEdge})} />
    {edge?.configuration && <button type="button" onClick={()=>editor.updatePlatform(platform.id,{edges:platform.edges.map(e=>e.id===edge.id?{id:e.id}:e)})}>Use default edge style</button>}
    {edge && <button type="button" onClick={()=>{
      const index=platform.edges.indexOf(edge), a=platform.polygon[index], b=platform.polygon[(index+1)%platform.polygon.length];
      const polygon=[...platform.polygon.slice(0,index+1),[(a[0]+b[0])/2,(a[1]+b[1])/2] as const,...platform.polygon.slice(index+1)];
      editor.updatePlatform(platform.id,{polygon:polygon as unknown as OutdoorPlatformSpec["polygon"]});
    }}>Add corner on edge</button>}
    <FloorFinishPalette value={platform.finish} onChange={finish=>editor.updatePlatform(platform.id,{finish})} target="outdoor-platform" showTarget={false} onTargetChange={()=>{}} />
    {platform.polygon.map((point,index)=><fieldset key={index}><legend>Corner {index+1} · plan units</legend>
      {([0,1] as const).map(axis=><label key={axis}>{axis===0?"X":"Y"}<CommittedNumberInput label={`Platform corner ${index+1} ${axis===0?"X":"Y"}`} value={point[axis]} step={.1} onCommit={value=>editor.updatePlatform(platform.id,{polygon:mapPoolOutline(platform.polygon,(p,i)=>i===index?axis===0?[value,p[1]]:[p[0],value]:p)})} /></label>)}
      {platform.polygon.length>3 && <button type="button" onClick={()=>editor.updatePlatform(platform.id,{polygon:platform.polygon.filter((_,i)=>i!==index) as unknown as OutdoorPlatformSpec["polygon"]})}>Remove corner {index+1}</button>}
    </fieldset>)}
    <button type="button" onClick={editor.deleteSelected}>Delete platform</button>
  </div>;
}

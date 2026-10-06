import type { StairShape } from "@cabane/engine";
export function StairShapeSelect({value,onChange}: {value:StairShape;onChange:(shape:StairShape)=>void}) {
  return <label className="construction-inspector__single-control">Shape<select aria-label="Stair shape" value={value}
    onChange={event=>onChange(event.target.value as StairShape)}>
    <option value="straight">Straight</option><option value="l-shaped">L-shaped</option><option value="spiral">Spiral</option>
  </select></label>;
}

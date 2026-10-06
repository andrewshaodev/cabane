import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import type { StairFlight } from "../flight-geometry";
import { StairPolygonSurface } from "./StairPolygonSurface";
import { StairStrokeSegments, type StairStroke } from "./StairStrokeSegments";

export interface StairPlanProps {
  flight:StairFlight;upper?:boolean;selected?:boolean;invalid?:boolean;
  handlers?:Pick<ThreeElements["mesh"],"onPointerDown"|"onPointerMove"|"onPointerUp"|"onPointerCancel">;
  onSelect?:()=>void;
}
export function ShapedStairPlan({flight,upper=false,selected=false,invalid=false,handlers,onSelect}:StairPlanProps) {
  const ink=invalid?"#bc433a":selected?"#ff754d":upper?"#6b7881":"#35434c";
  const strokes=useMemo(()=>{
    const result:StairStroke[]=[];
    const line=(a:readonly [number,number],b:readonly [number,number],width=.018)=>result.push({from:[a[0],.148,a[1]],to:[b[0],.148,b[1]],width});
    for(const tread of flight.treads) tread.polygon.forEach((p,i)=>line(p,tread.polygon[(i+1)%tread.polygon.length]));
    const path=upper?[...flight.path].reverse():flight.path;
    for(let i=1;i<path.length;i++) line([path[i-1].x,path[i-1].z],[path[i].x,path[i].z],.035);
    const tip=path[path.length-1],before=path[path.length-2],length=Math.hypot(tip.x-before.x,tip.z-before.z);
    const dx=(tip.x-before.x)/length,dz=(tip.z-before.z)/length;
    for(const side of [-1,1]) line([tip.x,tip.z],[tip.x-dx*.2+dz*.1*side,tip.z-dz*.2-dx*.1*side],.035);
    return result;
  },[flight,upper]);
  return <group name={`stair-plan-${flight.id}`}>
    <StairPolygonSurface name={`stair-plan-hit-${flight.id}`} polygon={flight.footprintWorld} elevation={.14} thickness={.004}
      emissive={invalid?"#f5c8c4":selected?"#f5d1ba":"#f3ede0"}
      onClick={onSelect?event=>event.stopPropagation():undefined}
      onPointerDown={onSelect?event=>{event.stopPropagation();onSelect();}:undefined}
      {...(!onSelect&&!handlers?{raycast:()=>undefined}:{})} {...handlers} />
    <StairStrokeSegments strokes={strokes} color={ink} plan />
  </group>;
}

import { planPointToWorld, pointInsidePolygon } from "../geometry";
import type { FloorCoordinates } from "../types";
import type { StairFlight } from "./flight-geometry";
import { stairEndCoordinates } from "./path-projection";
export interface StairGuardSegment {from:readonly [number,number,number];to:readonly [number,number,number];width:number}

/** Rail segments have explicit breaks at flight/landing boundaries. */
export function deriveStairGuardSegments(flight:StairFlight,coordinates:FloorCoordinates,upper=false):StairGuardSegment[] {
  const result:StairGuardSegment[]=[];
  const rail=(a:readonly [number,number],b:readonly [number,number],h1:number,h2:number,post=true)=>{
    result.push({from:[a[0],h1+.95,a[1]],to:[b[0],h2+.95,b[1]],width:.05});
    if(post)result.push({from:[a[0],h1,a[1]],to:[a[0],h1+.95,a[1]],width:.035});
  };
  const spec=flight.spec;
  if(spec.shape==='spiral'&&!upper) {
    const sign=spec.direction==='clockwise'?1:-1,turn=spec.totalTurnDegrees*Math.PI/180,r=spec.diameterMeters/2;
    const count=Math.ceil(spec.totalTurnDegrees/5);
    const point=(t:number):[number,number]=>[
      flight.originWorld[0]+r*(flight.side[0]*Math.cos(sign*turn*t)+flight.forward[0]*Math.sin(sign*turn*t)),
      flight.originWorld[1]+r*(flight.side[1]*Math.cos(sign*turn*t)+flight.forward[1]*Math.sin(sign*turn*t)),
    ];
    for(let i=0;i<count;i++)rail(point(i/count),point((i+1)/count),flight.riseMeters*i/count,flight.riseMeters*(i+1)/count,i%3===0);
  } else {
    const local=(p:readonly [number,number])=>{
      const dx=p[0]-flight.originWorld[0],dz=p[1]-flight.originWorld[1];
      return {x:dx*flight.side[0]+dz*flight.side[1],z:dx*flight.forward[0]+dz*flight.forward[1]};
    };
    const height=(p:readonly [number,number])=>{
      if(upper||spec.shape!=='l-shaped')return flight.riseMeters;
      const q=local(p),x=q.x*(spec.turn==='right'?1:-1),landing=flight.path[1].elevation;
      if(q.z<spec.lowerRunMeters)return Math.max(0,q.z/spec.lowerRunMeters)*landing;
      return landing+Math.max(0,Math.min(1,(x-spec.widthMeters/2)/spec.upperRunMeters))*(flight.riseMeters-landing);
    };
    const bridge=flight.upperLanding.map(p=>planPointToWorld(p,coordinates));
    flight.footprintWorld.forEach((a,i)=>{
      const b=flight.footprintWorld[(i+1)%flight.footprintWorld.length];
      const mid={x:(a[0]+b[0])/2,z:(a[1]+b[1])/2};
      const entry=stairEndCoordinates(mid,flight.path[0],flight.entranceForward);
      const exit=stairEndCoordinates(mid,flight.path[flight.path.length-1],flight.exitForward);
      if(upper&&pointInsidePolygon([mid.x,mid.z],bridge))return;
      if(Math.abs(exit.along)<.001&&Math.abs(exit.across)<flight.widthMeters/2+.01)return;
      if(!upper&&Math.abs(entry.along)<.001&&Math.abs(entry.across)<flight.widthMeters/2+.01)return;
      const breaks=[0,1];
      if(spec.shape==='l-shaped') {
        const p=local(a),q=local(b),sign=spec.turn==='right'?1:-1;
        for(const t of [(spec.lowerRunMeters-p.z)/(q.z-p.z),(sign*spec.widthMeters/2-p.x)/(q.x-p.x)])
          if(Number.isFinite(t)&&t>0&&t<1)breaks.push(t);
      }
      breaks.sort((x,y)=>x-y);
      const at=(t:number):[number,number]=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
      for(let j=1;j<breaks.length;j++) {
        const start=breaks[j-1],end=breaks[j],length=Math.hypot(b[0]-a[0],b[1]-a[1])*(end-start);
        const count=Math.max(1,Math.min(512,Math.ceil(length/.7)));
        for(let k=0;k<count;k++) {
          const p=at(start+(end-start)*k/count),q=at(start+(end-start)*(k+1)/count);
          rail(p,q,height(p),height(q),spec.shape!=='spiral'||i%4===0);
        }
      }
    });
  }
  // The spiral exit bridges the circular aperture and needs rails of its own.
  if(spec.shape==='spiral'&&!upper) {
    const points=flight.upperLanding.map(p=>planPointToWorld(p,coordinates));
    rail(points[0],points[3],flight.riseMeters,flight.riseMeters);
    rail(points[1],points[2],flight.riseMeters,flight.riseMeters);
  }
  return result;
}

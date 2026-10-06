import type { FloorSpec } from "../types";
import { isOutdoorPlatformOutline } from "./platform-geometry";
import { deriveOutdoorPlatformBarriers } from "./platform-barriers";
import { PlatformBarrierModel } from "./PlatformBarrierModel";
import { PlatformSlab } from "./PlatformSlab";
export function ArchitecturalOutdoorPlatforms({ floor, below }: { floor: FloorSpec; below?:FloorSpec }) {
  return <group name="outdoor-platforms">
    {(floor.outdoorPlatforms ?? []).filter(p=>isOutdoorPlatformOutline(p.polygon)).map(platform=><PlatformSlab key={platform.id} platform={platform} floor={floor} below={below} />)}
    {deriveOutdoorPlatformBarriers(floor).map((barrier,i)=><PlatformBarrierModel key={`${barrier.edgeId}-${i}`} name={`platform-barrier-${barrier.edgeId}-${i}`} {...barrier} />)}
  </group>;
}

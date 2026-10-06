import type { WalkToolNavigation } from "@cabane/engine";
import type { PortalPlaced } from "./portal-contract";
import { PortalTransitVeil } from "./PortalTransitVeil";
import { PortalSurface } from "./PortalSurface";
import { useGunPortals } from "./useGunPortals";

export function GunPortals({ active, navigation, reducedMotion, onPlaced }: {
  active: boolean; navigation: WalkToolNavigation; reducedMotion: boolean; onPlaced: PortalPlaced;
}) {
  const { pair, veil, iris } = useGunPortals(active, navigation, onPlaced, reducedMotion);
  return <>
    <PortalTransitVeil veil={veil} iris={iris} />
    {(["blue", "gold"] as const).map(color => pair[color] &&
    <PortalSurface key={color} color={color} anchor={pair[color]} linked={Boolean(pair.blue && pair.gold)} reducedMotion={reducedMotion} />)}</>;
}

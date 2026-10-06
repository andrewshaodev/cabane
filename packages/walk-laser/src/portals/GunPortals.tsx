import type { WalkToolNavigation } from "@cabane/engine";
import { useImperativeHandle, type Ref } from "react";
import { otherPortal, type PortalPlaced } from "./portal-contract";
import { PortalTransitVeil } from "./PortalTransitVeil";
import { PortalSurface } from "./PortalSurface";
import { useGunPortals } from "./useGunPortals";

export interface PortalControls { place: () => void }

export function GunPortals({ active, navigation, reducedMotion, onPlaced, controls }: {
  active: boolean; navigation: WalkToolNavigation; reducedMotion: boolean; onPlaced: PortalPlaced;
  controls?: Ref<PortalControls>;
}) {
  const { pair, place, veil, iris } = useGunPortals(active, navigation, onPlaced, reducedMotion);
  useImperativeHandle(controls, () => ({ place }), [place]);
  return <>
    <PortalTransitVeil veil={veil} iris={iris} />
    {(["blue", "gold"] as const).map(color => pair[color] &&
    <PortalSurface key={color} color={color} anchor={pair[color]} exit={pair[otherPortal(color)]} reducedMotion={reducedMotion} />)}</>;
}

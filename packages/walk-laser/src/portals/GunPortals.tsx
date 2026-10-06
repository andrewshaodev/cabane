import type { Ray } from "three";
import type { targetPortal } from "./portal-target";
import type { WalkToolNavigation } from "@cabane/engine";
import { useEffect, useImperativeHandle, type Ref } from "react";
import { otherPortal, type PortalPlaced, type PortalColor } from "./portal-contract";
import { PortalTransitVeil } from "./PortalTransitVeil";
import { PortalSurface } from "./PortalSurface";
import { useGunPortals } from "./useGunPortals";

export interface PortalControls { place: () => void; remove: (ray: Ray, distance: number) => ReturnType<typeof targetPortal> }

export function GunPortals({ active, navigation, reducedMotion, onPlaced, controls, onNextColor }: {
  active: boolean; navigation: WalkToolNavigation; reducedMotion: boolean; onPlaced: PortalPlaced;
  controls?: Ref<PortalControls>; onNextColor?: (color: PortalColor) => void;
}) {
  const { pair, next, closing, closed, remove, place, veil, iris } = useGunPortals(active, navigation, onPlaced, reducedMotion);
  useImperativeHandle(controls, () => ({ place, remove }), [place, remove]);
  useEffect(() => { onNextColor?.(next); }, [next, onNextColor]);
  return <>
    <PortalTransitVeil veil={veil} iris={iris} />
    {(["blue", "gold"] as const).map(color => pair[color] &&
    <PortalSurface key={color} color={color} anchor={pair[color]} exit={pair[otherPortal(color)]} reducedMotion={reducedMotion} />)}
    {(["blue", "gold"] as const).map(color => closing[color] &&
      <PortalSurface key={`closing-${color}`} color={color} anchor={closing[color]} reducedMotion={reducedMotion} closing onClosed={() => closed(color)} />)}
    </>;
}

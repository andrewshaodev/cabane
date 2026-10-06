import { Html } from "@react-three/drei";
import type { RefObject } from "react";
import "./portal-transit.css";

/** Screen-space energy covers the spatial cut without rendering a second scene. */
export function PortalTransitVeil({
  veil,
  iris,
}: {
  veil: RefObject<HTMLDivElement | null>;
  iris: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Html
      fullscreen
      calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div ref={veil} className="walk-portal-transit" aria-hidden="true">
        <div ref={iris} className="walk-portal-transit__iris" />
      </div>
    </Html>
  );
}

import { useMemo } from "react";
import { Shape } from "three";
import { ToonMaterial } from "@cabane/engine";
import { FramedGlassPanel } from "../windows/framed-glass-panel";
/** Rectangular steel glazing with a continuous decorative arch, not an arched wall cut. */
export function ArchedSteelGlassPanel({
  width,
  height,
  privacy = false,
}: {
  width: number;
  height: number;
  privacy?: boolean;
}) {
  const arch = useMemo(() => {
    const radius = width * 0.4,
      stroke = Math.min(0.022, width * 0.055),
      bottom = -height / 2 + 0.055,
      shoulder = height / 2 - 0.065 - radius;
    const shape = new Shape();
    shape.moveTo(-radius, bottom);
    shape.lineTo(-radius, shoulder);
    shape.absarc(0, shoulder, radius, Math.PI, 0, true);
    shape.lineTo(radius, bottom);
    shape.lineTo(radius - stroke, bottom);
    shape.lineTo(radius - stroke, shoulder);
    shape.absarc(0, shoulder, radius - stroke, 0, Math.PI, false);
    shape.lineTo(-radius + stroke, bottom);
    shape.closePath();
    return shape;
  }, [width, height]);
  return (
    <group name="arched-steel-glass-panel">
      <FramedGlassPanel
        width={width}
        height={height}
        columns={1}
        rows={1}
        privacy={privacy}
        frameDepth={0.045}
        frameColor="#292e2d"
      />
      <mesh name="steel-arch" position={[0, 0, -0.018]} castShadow>
        <extrudeGeometry args={[arch, { depth: 0.036, bevelEnabled: false, curveSegments: 32 }]} />
        <ToonMaterial color="#292e2d" />
      </mesh>
    </group>
  );
}

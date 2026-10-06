import { useMemo } from "react";
import { Shape } from "three";
import { Outlines, ToonMaterial } from "@cabane/engine";

/** A bent oak backrest: a solid curved strip in plan, extruded vertically. */
export function CurvedChairBack() {
  const shape = useMemo(() => {
    const strip = new Shape();
    strip.moveTo(-.245, -.125);
    strip.quadraticCurveTo(0, -.325, .245, -.125);
    strip.lineTo(.232, -.10);
    strip.quadraticCurveTo(0, -.289, -.232, -.10);
    strip.closePath();
    return strip;
  }, []);
  return <mesh name="curved-oak-backrest" position={[0, .82, -.025]} rotation={[Math.PI / 2, 0, 0]}
    castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth: .16, steps: 1, bevelEnabled: false, curveSegments: 16 }]} />
    <ToonMaterial color="#d5b17e" />
    <Outlines color="#82694b" thickness={.0015} screenspace={false} />
  </mesh>;
}

import { BufferGeometry, ExtrudeGeometry, Shape } from "three";
import { optimizedCreasedNormalGeometry } from "../creased-normal-geometry";

// Matches Drei's RoundedBox geometry, including its tiny corner arcs and
// centered extrusion. Cache CPU templates only; mounted meshes own their clones.
const templates = new Map<string, ExtrudeGeometry>();
const limit = 64;
export function roundedBoxGeometry(width: number, height: number, depth: number,
  radius: number, steps: number, smoothness: number, bevelSegments: number, creaseAngle: number) {
  const key = JSON.stringify([width, height, depth, radius, steps, smoothness, bevelSegments, creaseAngle]);
  let template = templates.get(key);
  if (!template) {
    const eps = .00001;
    const r = radius - eps;
    const shape = new Shape();
    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);
    template = new ExtrudeGeometry(shape, { depth: depth - radius * 2,
      bevelEnabled: true, bevelSegments: bevelSegments * 2, steps,
      bevelSize: r, bevelThickness: radius, curveSegments: smoothness });
    template.center();
    optimizedCreasedNormalGeometry(template, creaseAngle);
    templates.set(key, template);
    if (templates.size > limit) {
      const oldest = templates.keys().next().value!;
      templates.get(oldest)!.dispose();
      templates.delete(oldest);
    }
  } else {
    templates.delete(key);
    templates.set(key, template);
  }
  return new BufferGeometry().copy(template);
}

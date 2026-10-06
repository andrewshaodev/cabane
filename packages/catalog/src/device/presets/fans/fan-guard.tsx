import { useEffect, useMemo } from "react";
import { CylinderGeometry, Quaternion, TorusGeometry, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial } from "@cabane/engine";
import { palette } from "../../visuals/device-visual-state";

/** Front/back wire cages and the rails joining them; one solid mesh. */
export function FanGuard() {
  const geometry = useMemo(() => {
    const pieces: BufferGeometry[] = [];
    const rod = (from: Vector3, to: Vector3) => {
      const direction = to.clone().sub(from);
      const part = new CylinderGeometry(.0016, .0016, direction.length(), 4);
      part.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
      part.translate(...from.clone().add(to).multiplyScalar(.5).toArray());
      pieces.push(part);
    };
    for (const z of [-.025, .045]) {
      for (const radius of [.067, .12, .175]) {
        const ring = new TorusGeometry(radius, radius === .175 ? .005 : .0016, 4, 32);
        ring.translate(0, 0, z);
        pieces.push(ring);
      }
      for (let index = 0; index < 16; index++) {
        const angle = index * Math.PI / 8;
        rod(new Vector3(.028 * Math.cos(angle), .028 * Math.sin(angle), z),
          new Vector3(.175 * Math.cos(angle), .175 * Math.sin(angle), z));
      }
    }
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      rod(new Vector3(.175 * Math.cos(angle), .175 * Math.sin(angle), -.025),
        new Vector3(.175 * Math.cos(angle), .175 * Math.sin(angle), .045));
    }
    const result = mergeGeometries(pieces);
    pieces.forEach((piece) => piece.dispose());
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="fan-guard" geometry={geometry} castShadow>
    <ToonMaterial color={palette.charcoal} />
  </mesh>;
}

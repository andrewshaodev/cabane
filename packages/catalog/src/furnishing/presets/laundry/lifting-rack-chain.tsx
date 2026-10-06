import { useEffect, useMemo } from "react";
import { CurvePath, LineCurve3, CubicBezierCurve3, TubeGeometry, Vector3 } from "three";
import { ToonMaterial } from "@cabane/engine";

/** A quiet continuous chain loop around the left-hand lift pulley. */
export function LiftingRackChain() {
  const geometry = useMemo(() => {
    const path = new CurvePath<Vector3>();
    const point = (x: number, y: number) => new Vector3(x, y, 0.065);
    path.add(new LineCurve3(point(-0.59, 1.52), point(-0.59, 0.2)));
    path.add(
      new CubicBezierCurve3(
        point(-0.59, 0.2),
        point(-0.59, 0.177909),
        point(-0.572091, 0.16),
        point(-0.55, 0.16),
      ),
    );
    path.add(
      new CubicBezierCurve3(
        point(-0.55, 0.16),
        point(-0.527909, 0.16),
        point(-0.51, 0.177909),
        point(-0.51, 0.2),
      ),
    );
    path.add(new LineCurve3(point(-0.51, 0.2), point(-0.51, 1.52)));
    path.add(
      new CubicBezierCurve3(
        point(-0.51, 1.52),
        point(-0.51, 1.542091),
        point(-0.527909, 1.56),
        point(-0.55, 1.56),
      ),
    );
    path.add(
      new CubicBezierCurve3(
        point(-0.55, 1.56),
        point(-0.572091, 1.56),
        point(-0.59, 1.542091),
        point(-0.59, 1.52),
      ),
    );
    return new TubeGeometry(path, 64, 0.0012, 4, true);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="lifting-rack-chain" geometry={geometry}>
      <ToonMaterial color="#dad8cf" />
    </mesh>
  );
}

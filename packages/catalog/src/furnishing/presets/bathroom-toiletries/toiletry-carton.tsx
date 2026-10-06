import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TOILETRY_CARTON_SIZE = [0.045, 0.14, 0.03] as const;
/** Generic unbranded packaging; the open finish has a real cavity and raised rear flap. */
export function ToiletryCarton({
  size = TOILETRY_CARTON_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [w, h, d] = size,
    t = Math.min(0.001, w / 8, d / 8),
    open = variant === "cream-open",
    bodyH = open ? h * 0.9 : h;
  const accent =
    variant === "red" ? "#a8404b" : variant === "green" ? "#6b8c60" : open ? "#c5bd9f" : "#3b789e";
  return (
    <group name="toiletry-carton">
      {open ? (
        <>
          <mesh name="carton-bottom" position={[0, t / 2, 0]}>
            <boxGeometry args={[w, t, d]} />
            <ToonMaterial color="#eee9db" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={`side${side}`}
              name="carton-side"
              position={[(side * (w - t)) / 2, bodyH / 2, 0]}
            >
              <boxGeometry args={[t, bodyH, d]} />
              <ToonMaterial color="#eee9db" />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh
              key={`face${side}`}
              name="carton-face"
              position={[0, bodyH / 2, side === 1 ? d / 2 - 1.5 * t : -(d - t) / 2]}
            >
              <boxGeometry args={[w - 2 * t, bodyH, t]} />
              <ToonMaterial color="#eee9db" />
            </mesh>
          ))}
          <mesh name="carton-open-flap" position={[0, (bodyH + h) / 2, -(d - t) / 2]}>
            <boxGeometry args={[w - 2 * t, h - bodyH, t]} />
            <ToonMaterial color="#e0dacb" />
          </mesh>
        </>
      ) : (
        <mesh name="carton-case" position={[0, h / 2, -t / 2]}>
          <boxGeometry args={[w, h, d - t]} />
          <ToonMaterial color="#eee9db" />
        </mesh>
      )}
      <mesh name="carton-color-band" position={[0, h * 0.21, (d - t) / 2]}>
        <boxGeometry args={[w * 0.86, h * 0.3, t]} />
        <ToonMaterial color={accent} />
      </mesh>
    </group>
  );
}

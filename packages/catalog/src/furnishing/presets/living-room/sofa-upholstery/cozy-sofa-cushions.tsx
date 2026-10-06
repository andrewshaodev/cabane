import { TailoredCushion } from "./tailored-cushion";

/** Loose cushions lean into the back and rest on the sectional's seat pads. */
export function CozySofaCushions() {
  return (
    <group name="cozy-sofa-cushions">
      <TailoredCushion
        name="terracotta-throw-cushion"
        size={[0.43, 0.16, 0.43]}
        position={[-1.02, 0.884, -0.005]}
        rotation={[1.28, -0.08, -0.12]}
        color="#bf7658"
      />
      <TailoredCushion
        name="beige-throw-cushion"
        size={[0.4, 0.15, 0.4]}
        position={[1.04, 0.876, 0.005]}
        rotation={[1.3, 0.12, 0.15]}
        color="#e4cfaa"
      />
      <TailoredCushion
        name="clay-lumbar-cushion"
        size={[0.48, 0.18, 0.26]}
        position={[0.55, 0.813, 0.09]}
        rotation={[1.15, -0.08, -0.06]}
        color="#b86b50"
      />
    </group>
  );
}

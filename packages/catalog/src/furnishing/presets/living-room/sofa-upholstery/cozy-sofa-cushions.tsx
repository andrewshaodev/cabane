import { TailoredCushion } from "./tailored-cushion";

/** Loose cushions lean into the back and rest on the sectional's seat pads. */
export function CozySofaCushions() {
  return <group name="cozy-sofa-cushions">
    <TailoredCushion name="terracotta-throw-cushion" size={[.43, .16, .43]}
      position={[-1.02, .884, -.005]} rotation={[1.28, -.08, -.12]} color="#bf7658" />
    <TailoredCushion name="beige-throw-cushion" size={[.4, .15, .4]}
      position={[1.04, .876, .005]} rotation={[1.3, .12, .15]} color="#e4cfaa" />
    <TailoredCushion name="clay-lumbar-cushion" size={[.48, .18, .26]}
      position={[.55, .813, .09]} rotation={[1.15, -.08, -.06]} color="#b86b50" />
  </group>;
}

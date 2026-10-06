import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { CozySofaCushions, TailoredCushion } from "./sofa-upholstery";

/** Existing sectional envelope and offset origin retained for saved placements. */
export function CustomSectionalSofa({ variant = "default" }: { variant?: string } = {}) {
  return <group name="canape-salon-custom" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[2.72, .32, .72]} position={[0, .31, .02]} color="#d2ccbd" radius={.055} />
    <RoundedFurniturePanel size={[.88, .32, 1.56]} position={[-.91, .31, .43]} color="#d2ccbd" radius={.055} />
    <RoundedFurniturePanel name="upholstered-back-frame" size={[2.55, .65, .16]} position={[0, .675, -.33]} color="#d2ccbd" radius={.045} />
    <RoundedFurniturePanel name="oak-front-rail" size={[1.77, .055, .64]} position={[.455, .1575, .02]} color="#ad895b" radius={.012} />
    <RoundedFurniturePanel name="oak-chaise-rail" size={[.82, .055, 1.48]} position={[-.91, .1575, .43]} color="#ad895b" radius={.012} />
    <TailoredCushion name="chaise-seat-cushion" size={[.84, .2, 1.39]} position={[-.91, .57, .39]} color="#eee7d8" />
    {[-.02, .84].map(x => <TailoredCushion key={x} name="sectional-seat-cushion" size={[.8, .2, .63]} position={[x, .57, .08]} color="#e9e4d7" />)}
    {[-.91, -.02, .84].map(x => <TailoredCushion key={x} name="sectional-back-cushion" size={[.81, .2, .60]} position={[x, .927, -.29]} rotation={[Math.PI / 2, 0, 0]} color="#e9e4d7" />)}
    {[-1.37, 1.37].map(x => <group key={x}>
      <RoundedFurniturePanel name="sectional-arm" size={[.19, .59, .86]} position={[x, .455, .01]} color="#ded9ca" radius={.065} />
      <TailoredCushion name="sectional-arm-pad" size={[.18, .13, .84]} position={[x, .765, .01]} color="#eee7d8" />
    </group>)}
    {variant === "cozy" && <CozySofaCushions />}
    {[[-1.23,-.25],[-.55,-.25],[.48,-.25],[1.23,-.25],[-1.23,1.04],[-.58,1.04],[.48,.27],[1.23,.27]].map(([x,z]) =>
      <mesh key={`${x}-${z}`} position={[x,.085,z]} castShadow>
        <cylinderGeometry args={[.05,.035,.17,10]} /><ToonMaterial color="#b38d59" />
      </mesh>)}
  </group>;
}

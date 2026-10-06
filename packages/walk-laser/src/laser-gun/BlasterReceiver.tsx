import { RoundedBox } from "@cabane/engine";
import { BlasterReactor } from "./BlasterReactor";
import { BlasterFinish } from "./BlasterFinish";
import { SculptedBlasterPart } from "./SculptedBlasterPart";

export function BlasterReceiver() {
  return <group name="blaster-receiver">
    <SculptedBlasterPart contour="receiver" depth={.12} bevel={.024} finish="chassis" />
    {/* A gold seam follows the same flowing ivory silhouette on both cheeks. */}
    {[-1, 1].map(side => <group key={side}>
      <SculptedBlasterPart contour="armor" depth={.012} bevel={.014} finish="trim" x={side * .074} />
      <SculptedBlasterPart contour="armor" depth={.012} bevel={.009} finish="armor" x={side * .09} />
      <BlasterReactor side={side} />
      {/* Exactly three slanted, rounded recesses, as in the icon. */}
      {[.10, .15, .20].map(u => <group key={u} position={[side * .111, .048, -u]} rotation={[.38, 0, 0]}>
        <RoundedBox args={[.01, .06, .023]} radius={.004}><BlasterFinish kind="trim" /></RoundedBox>
        <RoundedBox args={[.013, .045, .014]} radius={.004} position={[side * .003, 0, 0]}><BlasterFinish kind="recess" /></RoundedBox>
      </group>)}
    </group>)}
    {/* Broad rounded rear bumper, with the small inset cyan status window. */}
    <RoundedBox args={[.155, .14, .055]} radius={.023} position={[0, .041, .211]}><BlasterFinish kind="trim" /></RoundedBox>
    <RoundedBox args={[.102, .091, .03]} radius={.013} position={[0, .044, .241]}><BlasterFinish kind="chassis" /></RoundedBox>
    <RoundedBox args={[.039, .038, .012]} radius={.005} position={[0, .05, .259]}><BlasterFinish kind="energy" /></RoundedBox>
    {/* Rounded rear shoulder joins the long illuminated spine. */}
    <RoundedBox args={[.17, .052, .13]} radius={.024} position={[0, .153, .108]} rotation={[-.12, 0, 0]}><BlasterFinish kind="armor" /></RoundedBox>
  </group>;
}

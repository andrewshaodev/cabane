import { RoundedBox } from "@cabane/engine";
import { BlasterFinish } from "./BlasterFinish";
import { SculptedBlasterPart } from "./SculptedBlasterPart";

export function BlasterGrip() {
  return <group name="blaster-grip">
    <SculptedBlasterPart contour="guard" depth={.035} bevel={.012} finish="trim" />
    <SculptedBlasterPart contour="trigger" depth={.033} bevel={.009} finish="hot" />
    <SculptedBlasterPart contour="grip" depth={.077} bevel={.016} finish="trim" />
    {[-1, 1].map(side => <SculptedBlasterPart key={side} contour="gripInset" depth={.012} bevel={.012} finish="grip" x={side * .05} />)}
    {/* Shallow continuous ribs hug the swept grip instead of protruding as fins. */}
    {[0, 1, 2, 3].map(index => <RoundedBox key={index} args={[.13, .007, .091]} radius={.003}
      position={[0, -.131 - index * .035, .138 + index * .017]} rotation={[-.32, 0, 0]}><BlasterFinish kind="chassis" /></RoundedBox>)}
    <SculptedBlasterPart contour="heel" depth={.105} bevel={.017} finish="armor" />
    <RoundedBox args={[.138, .012, .112]} radius={.005} position={[0, -.291, .207]} rotation={[-.29, 0, 0]}><BlasterFinish kind="energy" /></RoundedBox>
  </group>;
}

import { RoundedBox } from "@cabane/engine";
import { BlasterFinish } from "./BlasterFinish";
import { SculptedBlasterPart } from "./SculptedBlasterPart";

export function BlasterGrip() {
  return (
    <group name="blaster-grip">
      <SculptedBlasterPart contour="guard" depth={0.035} bevel={0.012} finish="trim" />
      <SculptedBlasterPart contour="trigger" depth={0.033} bevel={0.009} finish="hot" />
      <SculptedBlasterPart contour="grip" depth={0.077} bevel={0.016} finish="trim" />
      {[-1, 1].map((side) => (
        <SculptedBlasterPart
          key={side}
          contour="gripInset"
          depth={0.012}
          bevel={0.012}
          finish="grip"
          x={side * 0.05}
        />
      ))}
      {/* Shallow continuous ribs hug the swept grip instead of protruding as fins. */}
      {[0, 1, 2, 3].map((index) => (
        <RoundedBox
          key={index}
          args={[0.13, 0.007, 0.091]}
          radius={0.003}
          position={[0, -0.131 - index * 0.035, 0.138 + index * 0.017]}
          rotation={[-0.32, 0, 0]}
        >
          <BlasterFinish kind="chassis" />
        </RoundedBox>
      ))}
      <SculptedBlasterPart contour="heel" depth={0.105} bevel={0.017} finish="armor" />
      <RoundedBox
        args={[0.138, 0.012, 0.112]}
        radius={0.005}
        position={[0, -0.291, 0.207]}
        rotation={[-0.29, 0, 0]}
      >
        <BlasterFinish kind="energy" />
      </RoundedBox>
    </group>
  );
}

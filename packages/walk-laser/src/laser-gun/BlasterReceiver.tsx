import { RoundedBox } from "@cabane/engine";
import { BlasterReactor } from "./BlasterReactor";
import { BlasterFinish } from "./BlasterFinish";
import { SculptedBlasterPart } from "./SculptedBlasterPart";

export function BlasterReceiver() {
  return (
    <group name="blaster-receiver">
      <SculptedBlasterPart contour="receiver" depth={0.12} bevel={0.024} finish="chassis" />
      {/* A gold seam follows the same flowing ivory silhouette on both cheeks. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <SculptedBlasterPart
            contour="armor"
            depth={0.012}
            bevel={0.014}
            finish="trim"
            x={side * 0.074}
          />
          <SculptedBlasterPart
            contour="armor"
            depth={0.012}
            bevel={0.009}
            finish="armor"
            x={side * 0.09}
          />
          <BlasterReactor side={side} />
          {/* Exactly three slanted, rounded recesses, as in the icon. */}
          {[0.1, 0.15, 0.2].map((u) => (
            <group key={u} position={[side * 0.111, 0.048, -u]} rotation={[0.38, 0, 0]}>
              <RoundedBox args={[0.01, 0.06, 0.023]} radius={0.004}>
                <BlasterFinish kind="trim" />
              </RoundedBox>
              <RoundedBox
                args={[0.013, 0.045, 0.014]}
                radius={0.004}
                position={[side * 0.003, 0, 0]}
              >
                <BlasterFinish kind="recess" />
              </RoundedBox>
            </group>
          ))}
        </group>
      ))}
      {/* Broad rounded rear bumper, with the small inset cyan status window. */}
      <RoundedBox args={[0.155, 0.14, 0.055]} radius={0.023} position={[0, 0.041, 0.211]}>
        <BlasterFinish kind="trim" />
      </RoundedBox>
      <RoundedBox args={[0.102, 0.091, 0.03]} radius={0.013} position={[0, 0.044, 0.241]}>
        <BlasterFinish kind="chassis" />
      </RoundedBox>
      <RoundedBox args={[0.039, 0.038, 0.012]} radius={0.005} position={[0, 0.05, 0.259]}>
        <BlasterFinish kind="energy" />
      </RoundedBox>
      {/* Rounded rear shoulder joins the long illuminated spine. */}
      <RoundedBox
        args={[0.17, 0.052, 0.13]}
        radius={0.024}
        position={[0, 0.153, 0.108]}
        rotation={[-0.12, 0, 0]}
      >
        <BlasterFinish kind="armor" />
      </RoundedBox>
    </group>
  );
}

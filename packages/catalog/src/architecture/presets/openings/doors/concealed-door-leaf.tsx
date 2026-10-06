import { RoundedBox, ToonMaterial, type DoorFinish } from "@cabane/engine";
import { PanelDoorHandles } from "./panel-door-handles";

/** Plain leaf set into the aperture, flush with the selected wall face. */
export function ConcealedDoorLeaf({
  width,
  height,
  finish,
  handleSide,
}: {
  width: number;
  height: number;
  finish: DoorFinish;
  handleSide: -1 | 1;
}) {
  return (
    <group name="concealed-door-leaf">
      <RoundedBox args={[width, height, 0.05]} radius={0.002} smoothness={2} castShadow>
        <ToonMaterial color={finish === "white" ? "#f1f0eb" : "#b89a73"} />
      </RoundedBox>
      <PanelDoorHandles width={width} side={handleSide} />
    </group>
  );
}

import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { DoorSpec } from "@cabane/engine";
import { FramedGlassPanel } from "../windows/framed-glass-panel";
import { GlassDoorHandle } from "./glass-door-handle";
import { PanelDoorHandles } from "./panel-door-handles";
import { PlankDoorLeaf } from "./plank-door-leaf";

export function DoorLeaf({
  opening,
  width,
  height,
  handleSide,
}: {
  opening: DoorSpec;
  width: number;
  height: number;
  handleSide: -1 | 1;
}) {
  const white = opening.finish === "white";
  const frameColor = white ? "#d8d2c6" : "#9c6b49";

  if (opening.variant === "french" || opening.variant === "full-glass") {
    return (
      <group>
        <FramedGlassPanel
          width={width}
          height={height}
          columns={opening.variant === "french" ? 2 : 1}
          rows={opening.variant === "french" ? 5 : 1}
          frameColor={frameColor}
        />
        {opening.variant === "french" ? (
          <PanelDoorHandles width={width} side={handleSide} />
        ) : (
          <GlassDoorHandle width={width} side={handleSide} />
        )}
      </group>
    );
  }

  if (opening.variant === "plank") {
    return (
      <PlankDoorLeaf
        width={width}
        height={height}
        handleSide={handleSide}
        finish={opening.finish}
      />
    );
  }

  return (
    <group>
      <RoundedBox args={[width, height, 0.05]} radius={0.018} smoothness={3} castShadow>
        <ToonMaterial color={white ? "#f1f0eb" : "#b89a73"} />
        <Outlines
          color={white ? "#676965" : "#493c31"}
          thickness={white ? 0.008 : 0.01}
          screenspace={false}
        />
      </RoundedBox>
      <PanelDoorHandles width={width} side={handleSide} />
    </group>
  );
}

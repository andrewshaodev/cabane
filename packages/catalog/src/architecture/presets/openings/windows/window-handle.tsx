import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { WindowSpec } from "@cabane/engine";
import { OpeningFrameBox } from "../opening-frame-box";

export function WindowHandle({
  handleSide,
  faceSide,
  width,
  glazing,
}: {
  handleSide: -1 | 1;
  faceSide: -1 | 1;
  width: number;
  glazing: WindowSpec["glazing"];
}) {
  if (glazing === "clear") {
    return (
      <group
        name="opening-window-handle-clear"
        position={[handleSide * (width / 2 - Math.min(0.07, width * 0.2)), -0.02, faceSide * 0.075]}
        scale={[1, 1, faceSide]}
      >
        <OpeningFrameBox size={[0.045, 0.2, 0.055]} position={[0, 0, 0]} />
      </group>
    );
  }

  return (
    <group
      name="opening-window-handle-privacy"
      position={[handleSide * (width / 2 - Math.min(0.07, width * 0.2)), -0.08, faceSide * 0.085]}
      scale={[1, 1, faceSide]}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
        <ToonMaterial color="#747a79" />
      </mesh>
      <RoundedBox
        args={[0.025, 0.16, 0.032]}
        radius={0.012}
        smoothness={2}
        position={[0, -0.055, 0.02]}
        castShadow
      >
        <ToonMaterial color="#747a79" />
        <Outlines thickness={0.004} color="#353938" screenspace={false} />
      </RoundedBox>
    </group>
  );
}

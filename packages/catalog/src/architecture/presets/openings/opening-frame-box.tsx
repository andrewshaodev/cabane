import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";

export function OpeningFrameBox({
  size,
  position,
  color = "#e7e2d8",
}: {
  size: [number, number, number];
  position: [number, number, number];
  color?: string;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={Math.min(0.008, ...size.map((value) => value / 2))}
      smoothness={2}
      castShadow
    >
      <ToonMaterial color={color} />
      <Outlines thickness={0.004} color="#77736d" screenspace={false} />
    </RoundedBox>
  );
}

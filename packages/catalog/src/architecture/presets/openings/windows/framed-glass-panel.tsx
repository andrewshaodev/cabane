import { ToonMaterial } from "@cabane/engine";
import { OpeningFrameBox } from "../opening-frame-box";

export function FramedGlassPanel({
  width,
  height,
  columns,
  rows,
  privacy = false,
  frameDepth = 0.065,
  frameColor = "#e7e2d8",
}: {
  width: number;
  height: number;
  columns: number;
  rows: number;
  privacy?: boolean;
  frameDepth?: number;
  frameColor?: string;
}) {
  const frame = Math.min(0.055, width * 0.14, height * 0.14);
  const innerWidth = Math.max(0.02, width - frame * 2);
  const innerHeight = Math.max(0.02, height - frame * 2);
  const rowPositions = privacy && rows === 2
    ? [-innerHeight * 0.18]
    : Array.from(
      { length: Math.max(0, rows - 1) },
      (_, index) => -innerHeight / 2 + innerHeight * ((index + 1) / rows),
    );

  return (
    <group>
      <mesh receiveShadow>
        <boxGeometry args={[innerWidth, innerHeight, 0.024]} />
        <ToonMaterial
          color={privacy ? "#aed8dc" : "#9bcbd2"}
          transparent
          opacity={privacy ? 0.43 : 0.48}
          depthWrite={false}
        />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <OpeningFrameBox
          key={`vertical-${side}`}
          size={[frame, height, frameDepth]}
          position={[side * (width / 2 - frame / 2), 0, 0]}
          color={frameColor}
        />
      ))}
      {([-1, 1] as const).map((side) => (
        <OpeningFrameBox
          key={`horizontal-${side}`}
          size={[width, frame, frameDepth]}
          position={[0, side * (height / 2 - frame / 2), 0]}
          color={frameColor}
        />
      ))}
      {Array.from({ length: Math.max(0, columns - 1) }, (_, index) => (
        <OpeningFrameBox
          key={`column-${index}`}
          size={[0.026, innerHeight, frameDepth * 0.7]}
          position={[-innerWidth / 2 + innerWidth * ((index + 1) / columns), 0, 0.014]}
          color={frameColor}
        />
      ))}
      {rowPositions.map((position, index) => (
        <OpeningFrameBox
          key={`row-${index}`}
          size={[innerWidth, privacy ? 0.022 : 0.026, frameDepth * 0.7]}
          position={[0, position, 0.014]}
          color={frameColor}
        />
      ))}
    </group>
  );
}

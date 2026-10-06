import { RoundedStoragePanel } from ".././rounded-storage-panel";
import { WovenInset } from "./woven-inset";

export function CaneDoor({
  width,
  height,
  frontZ,
}: {
  readonly width: number;
  readonly height: number;
  readonly frontZ: number;
}) {
  return (
    <group>
      <RoundedStoragePanel
        size={[width, height, 0.038]}
        position={[0, height / 2, frontZ]}
        color="#e7ddd5"
        outline="#756b65"
      />
      <WovenInset width={width - 0.13} height={0.78} y={height - 0.48} z={frontZ + 0.025} />
      <WovenInset width={width - 0.13} height={0.68} y={0.48} z={frontZ + 0.025} />
    </group>
  );
}

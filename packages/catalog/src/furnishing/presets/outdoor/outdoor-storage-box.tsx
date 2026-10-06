import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OUTDOOR_STORAGE_BOX_SIZE = [1.2, 0.6, 0.55] as const;

export function OutdoorStorageBox({ size = OUTDOOR_STORAGE_BOX_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="outdoor-storage-box" scale={[size[0] / 1.2, size[1] / 0.6, size[2] / 0.55]} userData={{ walkCollider: true }}>
      <RoundedFurniturePanel name="case" size={[1.16, 0.54, 0.51]} position={[0, 0.27, 0]} color="#6d8063" />
      <RoundedFurniturePanel name="lid" size={[1.2, 0.06, 0.55]} position={[0, 0.57, 0]} color="#7e906f" />
      <RoundedFurniturePanel name="grip" size={[0.2, 0.03, 0.025]} position={[0, 0.48, 0.2625]} color="#414e49" />
      <RoundedFurniturePanel name="panel-seam" size={[1.1, 0.008, 0.005]} position={[0, 0.12, 0.2575]} color="#414e49" />
      <RoundedFurniturePanel name="panel-seam" size={[1.1, 0.008, 0.005]} position={[0, 0.24, 0.2575]} color="#414e49" />
      <RoundedFurniturePanel name="panel-seam" size={[1.1, 0.008, 0.005]} position={[0, 0.36, 0.2575]} color="#414e49" />
    </group>
  );
}

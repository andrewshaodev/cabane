import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_FLOATING_SHELF_SIZE = [1.1, 0.035, 0.24] as const;

/** One plain oak board with concealed fixings; back at Z=0, underside at Y=0. */
export function OakFloatingShelf({ size = OAK_FLOATING_SHELF_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="oak-floating-shelf" scale={[size[0] / 1.1, size[1] / 0.035, size[2] / 0.24]}>
      <RoundedFurniturePanel
        name="oak-floating-shelf-board"
        size={[1.1, 0.035, 0.24]}
        position={[0, 0.0175, 0.12]}
        color="#b18a5c"
        radius={0.003}
        outlineColor="#806341"
      />
    </group>
  );
}

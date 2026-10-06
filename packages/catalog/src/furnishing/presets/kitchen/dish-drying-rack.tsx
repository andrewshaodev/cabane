import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DISH_DRYING_RACK_SIZE = [0.45, 0.15, 0.32] as const;

/** Drain tray with eight plate dividers and open side rails. */
export function DishDryingRack({ size = DISH_DRYING_RACK_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="dish-drying-rack"
      scale={[size[0] / 0.45, size[1] / 0.15, size[2] / 0.32]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="drain-tray"
        size={[0.45, 0.02, 0.32]}
        position={[0, 0.01, 0]}
        color="#81958a"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.19, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.19, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[-0.19, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.1357143, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.1357143, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[-0.1357143, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.0814286, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.0814286, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[-0.0814286, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.027142899999999998, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[-0.027142899999999998, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[-0.027142899999999998, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.027142799999999995, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.027142799999999995, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[0.027142799999999995, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.08142850000000001, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.08142850000000001, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[0.08142850000000001, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.1357142, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.1357142, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[0.1357142, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.1899999, 0.085, -0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-post"
        size={[0.008, 0.13, 0.008]}
        position={[0.1899999, 0.085, 0.115]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="divider-top"
        size={[0.008, 0.008, 0.238]}
        position={[0.1899999, 0.146, 0]}
        color="#606b70"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="side-rail"
        size={[0.4, 0.012, 0.012]}
        position={[0, 0.05, -0.13]}
        color="#606b70"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="side-rail"
        size={[0.4, 0.012, 0.012]}
        position={[0, 0.05, 0.13]}
        color="#606b70"
        radius={0.006}
      />
    </group>
  );
}

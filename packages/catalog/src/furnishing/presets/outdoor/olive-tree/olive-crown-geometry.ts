import { Color, Float32BufferAttribute, IcosahedronGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createOliveLeafSprays } from "./olive-leaf-sprays";
import { OLIVE_CROWN_LOBES } from "./olive-tree-structure";

export function createOliveCrownGeometry() {
  // Sparse, slightly oversized olives remain legible beneath the leafy sprays.
  const fruit = OLIVE_CROWN_LOBES.flatMap(({ center, radius }, lobe) =>
    [-1, 1].map((side) => {
      const olive = new IcosahedronGeometry(1, 1);
      olive.scale(0.043, 0.062, 0.043);
      olive.translate(
        center[0] + side * radius[0] * 0.34,
        center[1] - radius[1] * 0.62,
        center[2] + radius[2] * 0.2,
      );
      const color = new Color(lobe % 3 === 0 ? "#8b914e" : "#424039");
      olive.setAttribute(
        "color",
        new Float32BufferAttribute(
          Array.from({ length: olive.getAttribute("position").count }, () => [
            color.r,
            color.g,
            color.b,
          ]).flat(),
          3,
        ),
      );
      return olive;
    }),
  );
  const leaves = createOliveLeafSprays();
  const olives = mergeGeometries(fruit);
  fruit.forEach((geometry) => geometry.dispose());
  return { leaves, olives };
}

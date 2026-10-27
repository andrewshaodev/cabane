import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { Object3D } from "three";
import type { EntityStateSnapshot } from "../types";
import type { CustomModelLight } from "./contracts";
import { controlImportedLightMaterials } from "./light-materials";

/** Used by import preview and runtime so both obey the same material lifetime. */
export function ImportedModelSurface({
  root,
  light,
  state,
}: {
  root: Object3D;
  light?: CustomModelLight | undefined;
  state?: EntityStateSnapshot | undefined;
}) {
  const invalidate = useThree((scene) => scene.invalidate);
  const controller = useRef<ReturnType<typeof controlImportedLightMaterials> | null>(null);
  const names = light?.emissiveMaterials;
  useLayoutEffect(() => {
    const materials = controlImportedLightMaterials(root, names ?? []);
    controller.current = materials;
    return () => {
      controller.current = null;
      materials.dispose();
    };
  }, [root, names]);
  useLayoutEffect(() => {
    controller.current?.update(state, light?.color ?? "#ffe3b4");
    invalidate();
  }, [root, names, state, light?.color, invalidate]);
  return <primitive object={root} dispose={null} />;
}

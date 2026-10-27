import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import type { Group } from "three";
import type { CustomModelLight } from "../imported-models/contracts";
import type { EntityStateSnapshot } from "../types";
import { controlModelLightMaterials } from "./surfaces";

export const ModelLightingStateContext = createContext<{
  state: EntityStateSnapshot | undefined;
} | null>(null);
export const useModelLightingState = () => useContext(ModelLightingStateContext);
export function ModelLightingSurface({
  children,
  light,
  state,
  imported = false,
  revision = "",
}: {
  children: ReactNode;
  light?: CustomModelLight | undefined;
  state?: EntityStateSnapshot | undefined;
  imported?: boolean;
  revision?: string;
}) {
  const root = useRef<Group>(null);
  const invalidate = useThree((scene) => scene.invalidate);
  const controller = useRef<ReturnType<typeof controlModelLightMaterials> | null>(null);
  useLayoutEffect(() => {
    if (!root.current || imported || !light) return;
    const instance = controlModelLightMaterials(root.current, light);
    controller.current = instance;
    return () => {
      controller.current = null;
      instance.dispose();
    };
  }, [light, imported, revision]);
  useLayoutEffect(() => {
    controller.current?.update(state, light?.color ?? "#ffe3b4");
    invalidate();
  }, [light, state, revision, invalidate]);
  return (
    <ModelLightingStateContext.Provider value={{ state }}>
      <group ref={root}>{children}</group>
    </ModelLightingStateContext.Provider>
  );
}

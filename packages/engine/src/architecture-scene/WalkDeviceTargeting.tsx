import { useFrame, useThree } from "@react-three/fiber";

import { Raycaster, Vector2, type Intersection, type Object3D } from "three";

import { useEffect, useMemo, useRef } from "react";

import type { ExtensionInteractionTarget } from "../types";

const walkDeviceTargetForObject = (object: Object3D) => {
  let candidate: Object3D | null = object;
  while (candidate) {
    const target = candidate.userData.walkDeviceInteraction as
      ExtensionInteractionTarget | undefined;
    if (target) return target;
    candidate = candidate.parent;
  }
  return null;
};

export function WalkDeviceTargeting({
  active,
  onTargetChange,
}: {
  active: boolean;
  onTargetChange: (target: ExtensionInteractionTarget | null) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const screenCenter = useMemo(() => new Vector2(0, 0), []);
  const hits = useMemo<Intersection[]>(() => [], []);
  const currentTargetId = useRef<string | null>(null);

  useFrame(() => {
    let target: ExtensionInteractionTarget | null = null;
    if (active) {
      raycaster.setFromCamera(screenCenter, camera);
      hits.length = 0;
      const firstHit = raycaster.intersectObjects(scene.children, true, hits)[0];
      if (firstHit) target = walkDeviceTargetForObject(firstHit.object);
    }
    const targetId = target?.id ?? null;
    if (targetId === currentTargetId.current) return;
    currentTargetId.current = targetId;
    onTargetChange(target);
  });

  useEffect(() => () => onTargetChange(null), [onTargetChange]);
  return null;
}

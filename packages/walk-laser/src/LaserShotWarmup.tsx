import { createPortal, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Scene, Vector3, WebGLRenderTarget } from "three";
import { LaserShot } from "./LaserShot";

/** Compile and retain effect programs on equip, before the first trigger press. */
export function LaserShotWarmup() {
  const { gl, camera, scene } = useThree();
  const effects = useMemo(() => new Scene(), []);
  const shot = useMemo(
    () => ({ id: 0, start: new Vector3(), end: new Vector3(0, 0, -1), hit: true }),
    [],
  );
  useEffect(() => {
    void gl.compileAsync(effects, camera, scene);
    // The host contour pass draws into a linear offscreen target. Prepare that
    // shader variant too, without drawing or changing the host's scene.
    const target = new WebGLRenderTarget(1, 1);
    const previous = gl.getRenderTarget();
    try {
      gl.setRenderTarget(target);
      void gl.compileAsync(effects, camera, scene);
    } finally {
      gl.setRenderTarget(previous);
      target.dispose();
    }
  }, [gl, camera, scene, effects]);
  // This scene is never drawn or picked; its materials keep shared programs alive.
  return createPortal(<LaserShot shot={shot} />, effects);
}

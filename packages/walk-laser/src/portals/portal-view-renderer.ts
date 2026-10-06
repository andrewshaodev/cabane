import { HalfFloatType, Vector2, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Scene, type WebGLRenderer } from "three";
import type { PortalAnchor } from "./portal-contract";

/** One bounded live scene capture. The host supplies its renderer and scene. */
export function createPortalViewRenderer() {
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: true });
  target.texture.name = "portal-destination-view";
  const size = new Vector2(), viewport = new Vector4(), scissor = new Vector4();
  const hidden: Object3D[] = [];
  return {
    target,
    render(renderer: WebGLRenderer, scene: Scene, camera: Camera, exit: PortalAnchor) {
      renderer.getDrawingBufferSize(size);
      const ratio = Math.min(1, 1024 / Math.max(size.x, size.y));
      const width = Math.max(1, Math.round(size.x * ratio)), height = Math.max(1, Math.round(size.y * ratio));
      if (target.width !== width || target.height !== height) target.setSize(width, height);
      const previousTarget = renderer.getRenderTarget();
      const face = renderer.getActiveCubeFace(), mip = renderer.getActiveMipmapLevel();
      renderer.getViewport(viewport); renderer.getScissor(scissor);
      const scissorTest = renderer.getScissorTest(), autoClear = renderer.autoClear;
      const xr = renderer.xr.enabled, shadows = renderer.shadowMap.autoUpdate, shadowUpdate = renderer.shadowMap.needsUpdate;
      try {
        // Never see the exit's own frame from inside its aperture: the near
        // clip slices its thick rim/ripple into moving slivers over the view.
        // Other portals keep their membrane, without recursive live sampling.
        scene.traverse(object => {
          if ((object.userData.portalLiveView || object.userData.portalAnchor === exit) && object.visible) {
            hidden.push(object); object.visible = false;
          }
        });
        renderer.xr.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = false;
        renderer.autoClear = true;
        renderer.setRenderTarget(target);
        renderer.setScissorTest(false);
        renderer.render(scene, camera);
      } finally {
        for (const object of hidden) object.visible = true;
        hidden.length = 0;
        renderer.xr.enabled = xr;
        renderer.shadowMap.autoUpdate = shadows;
        renderer.shadowMap.needsUpdate = shadowUpdate;
        renderer.autoClear = autoClear;
        renderer.setRenderTarget(previousTarget, face, mip);
        renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
      }
    },
    dispose() { target.dispose(); },
  };
}

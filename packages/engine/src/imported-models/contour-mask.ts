import {
  DepthTexture,
  MeshDepthMaterial,
  NearestFilter,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { IMPORTED_MODEL_LAYER } from "./glb-resources";

/** Only imported meshes enter this depth pass. Native batches stay untouched. */
export class ImportedContourMask {
  readonly target = new WebGLRenderTarget(1, 1, { depthTexture: new DepthTexture(1, 1) });
  private readonly depth = new MeshDepthMaterial({ colorWrite: false });
  constructor() {
    this.target.depthTexture!.minFilter = NearestFilter;
    this.target.depthTexture!.magFilter = NearestFilter;
  }
  render(gl: WebGLRenderer, scene: Scene, camera: Camera, width: number, height: number) {
    let present = false;
    scene.traverse((object) => {
      if (object.userData.importedModel === true && object.visible) present = true;
    });
    if (!present) return false;
    if (this.target.width !== width || this.target.height !== height)
      this.target.setSize(width, height);
    const layers = camera.layers.mask,
      material = scene.overrideMaterial,
      background = scene.background;
    const shadows = gl.shadowMap.enabled;
    try {
      camera.layers.set(IMPORTED_MODEL_LAYER);
      scene.overrideMaterial = this.depth;
      scene.background = null;
      gl.shadowMap.enabled = false;
      gl.setRenderTarget(this.target);
      gl.clear();
      gl.render(scene, camera);
    } finally {
      camera.layers.mask = layers;
      scene.overrideMaterial = material;
      scene.background = background;
      gl.shadowMap.enabled = shadows;
    }
    return true;
  }
  dispose() {
    this.target.dispose();
    this.depth.dispose();
  }
}

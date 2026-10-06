import { OrthographicCamera, Vector3 } from "three";

/** Scroll moves the plan; trackpad pinch (Ctrl-wheel) zooms around the cursor. */
export function navigatePlanWheel(
  event: WheelEvent, camera: OrthographicCamera, target: Vector3,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  minZoom: number, maxZoom: number,
) {
  if (!rect.width || !rect.height) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
  camera.updateMatrixWorld();
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const worldWidth = (camera.right - camera.left) / camera.zoom;
  const worldHeight = (camera.top - camera.bottom) / camera.zoom;
  const offset = new Vector3();
  if (event.ctrlKey || event.metaKey) {
    const oldZoom = camera.zoom;
    camera.zoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * Math.exp(-event.deltaY * unit * .01)));
    const ratio = 1 - oldZoom / camera.zoom;
    offset.addScaledVector(right, ((event.clientX - rect.left) / rect.width - .5) * worldWidth * ratio);
    offset.addScaledVector(up, (.5 - (event.clientY - rect.top) / rect.height) * worldHeight * ratio);
    camera.updateProjectionMatrix();
  } else {
    offset.addScaledVector(right, event.deltaX * unit * worldWidth / rect.width);
    offset.addScaledVector(up, -event.deltaY * unit * worldHeight / rect.height);
  }
  camera.position.add(offset);
  target.add(offset);
}

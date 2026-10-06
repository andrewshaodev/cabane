import { connectedCanvasEvents } from "@cabane/engine";
import type { RootStore } from "@react-three/fiber";

/** Visible editing handles take precedence over scene geometry beneath them. */
export function editorCanvasEvents(store: RootStore) {
  const manager = connectedCanvasEvents(store);
  manager.filter = (intersections) =>
    [...intersections].sort(
      (a, b) =>
        Number(b.object.userData.constructionEditHandle === true) -
        Number(a.object.userData.constructionEditHandle === true),
    );
  return manager;
}

import { homeManifest, ownerHomeProject } from "../../home/src";
import { editorBindingsForManifest } from "../../apps/web/src/project-runtime";
export { homeManifest, ownerHomeProject, homeExtensions } from "../../home/src";
export const ownerProjectManifest = homeManifest;
export const ownerEditorResolvedBindings = editorBindingsForManifest(homeManifest);
export const ownerSceneDeviceItems = ownerHomeProject.sceneItems.filter(
  (item) => item.kind === "device",
);

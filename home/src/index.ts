import { composeHomeManifest } from "@cabane/engine";
import { ownerHomeProject } from "./project";
import { homeExtensions } from "./extensions";

export { ownerHomeProject, homeExtensions };
export const homeManifest = composeHomeManifest(ownerHomeProject, homeExtensions);

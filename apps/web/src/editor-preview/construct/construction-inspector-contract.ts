import type { RoofSettings, ManifestIssue } from "@cabane/engine";
import type { ConstructEditorController } from "./construct-controller-contract";
import type { ConstructContextualIssue } from "./contextual-validation";
import type { FloorPaintingInspector } from "./floor-painting-contract";
export interface ConstructionInspectorProps {
  inert?: boolean;
  referencePlanControls?: import("react").ReactNode;
  planImportControls?: import("react").ReactNode;
  northControls?: import("react").ReactNode;
  tutorialControls?: import("react").ReactNode;
  walkStartControls?: import("react").ReactNode;
  roof?: RoofSettings | undefined;
  onRoofChange?: (settings: RoofSettings) => void;
  editor: ConstructEditorController;
  dependencyIssues?: readonly ManifestIssue[];
  contextualIssues?: readonly ConstructContextualIssue[];
  onIssueFocus?: (issue: ConstructContextualIssue) => void;
  floorPainting?: FloorPaintingInspector;
}

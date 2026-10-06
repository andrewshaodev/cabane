import { defineFurnishingModel } from "@cabane/engine";
import { StudentStorageDesk } from "../presets/children-bedroom/student-storage-desk";
export const studentStorageDeskDefinition = defineFurnishingModel({
  component: StudentStorageDesk,
  label: "Student storage desk",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [1.26, 0.756, 0.55],
  bounds: { min: [-0.63, 0, -0.275], max: [0.63, 0.756, 0.275] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 13, triangles: 5200 },
});

import { defineFurnishingModel } from "@cabane/engine";
import { WhiteFoldingChair } from "../presets/office/white-folding-chair";
export const whiteFoldingChairDefinition = defineFurnishingModel({
 component: WhiteFoldingChair, label: "White folding chair", category: "Office", defaultRoomType: "bedroom",
 defaultSize: [0.46,0.8,0.52], bounds: { min: [-0.23,0,-0.26], max: [0.23,0.8,0.26] },
 resizePolicy: { kind: "axes", axes: ["width","height","depth"] }, preferredPlacement: "absolute",
 outlineContact: true, complexity: { visibleMeshes: 12, triangles: 2400 },
});

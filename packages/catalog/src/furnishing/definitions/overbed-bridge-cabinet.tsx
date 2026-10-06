import { defineFurnishingModel } from "@cabane/engine";
import { OverbedBridgeCabinet } from "../presets/bedroom/overbed-bridge-cabinet";
export const overbedBridgeCabinetDefinition = defineFurnishingModel({
 component: OverbedBridgeCabinet, label: "Overbed bridge cabinet", category: "Storage", defaultRoomType: "bedroom",
 defaultSize: [2,0.65,0.4], bounds: { min: [-1.0,0,-0.2], max: [1.0,0.65,0.2] },
 resizePolicy: { kind: "axes", axes: ["width","height","depth"] }, preferredPlacement: "absolute",
 outlineContact: true, complexity: { visibleMeshes: 9, triangles: 2500 },
});

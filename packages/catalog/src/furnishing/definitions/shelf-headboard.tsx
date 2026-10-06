import { defineFurnishingModel } from "@cabane/engine";
import { ShelfHeadboard } from "../presets/bedroom/shelf-headboard";
export const shelfHeadboardDefinition = defineFurnishingModel({
 component: ShelfHeadboard, label: "Shelf headboard", category: "Bedroom", defaultRoomType: "bedroom",
 defaultSize: [2,1.15,0.22], bounds: { min: [-1.0,0,-0.11], max: [1.0,1.15,0.11] },
 resizePolicy: { kind: "axes", axes: ["width","height","depth"] }, preferredPlacement: "absolute",
 outlineContact: true, complexity: { visibleMeshes: 5, triangles: 2200 },
});

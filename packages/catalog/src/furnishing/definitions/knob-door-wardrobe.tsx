import { defineFurnishingModel } from "@cabane/engine";
import { KnobDoorWardrobe } from "../presets/bedroom/knob-door-wardrobe";
export const knobDoorWardrobeDefinition = defineFurnishingModel({
 component: KnobDoorWardrobe, label: "Knob door wardrobe", category: "Storage", defaultRoomType: "bedroom",
 defaultSize: [1.0,2.4,0.6], bounds: { min: [-0.5,0,-0.3], max: [0.5,2.4,0.3] },
 resizePolicy: { kind: "axes", axes: ["width","height","depth"] }, preferredPlacement: "absolute",
 outlineContact: true, complexity: { visibleMeshes: 5, triangles: 1500 },
});

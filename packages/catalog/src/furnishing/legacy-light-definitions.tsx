import { defineFurnishingModel } from "@cabane/engine";
import { ChildrenPendantGeometry, WovenPendantGeometry, TableLampModel, TABLE_LAMP_SIZE } from "../device/presets/lighting";
/** Preserve saved pre-device lighting items; Arrange offers their device replacements. */
export const legacyLightFurnishingDefinitions = {
  "table-lamp": defineFurnishingModel({
    legacyOnly: true,
    component: ({ size }) => <group scale={[size[0]/.32,size[1]/.52,size[2]/.32]}><TableLampModel visualState="connected-inactive" /></group>, label: "Table lamp", category: "Lighting", defaultRoomType: "bedroom",
    defaultSize: TABLE_LAMP_SIZE, bounds: { min: [-.16, 0, -.16], max: [.16, .52, .16] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute",
    outlineContact: false, complexity: { visibleMeshes: 4, triangles: 2_000 },
  }),
  "woven-pendant": defineFurnishingModel({
    legacyOnly: true,
    defaultRoomType: "dining-room",
    component: ({ size }) => <group scale={[size[0] / .847, size[1] / .58, size[2] / .86]}><WovenPendantGeometry /></group>,
    label: "Woven pendant", category: "Lighting",
    defaultSize: [.847, .58, .86], bounds: { min: [-.4235, -.58, -.43], max: [.4235, 0, .43] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "ceiling",
    outlineContact: false, complexity: { visibleMeshes: 22, triangles: 5_800 },
  }),
  "children-pendant": defineFurnishingModel({
    legacyOnly: true,
    defaultRoomType: "bedroom",
    component: ({ size }) => <group scale={[size[0] / .58, size[1] / .479, size[2] / .58]}><ChildrenPendantGeometry /></group>,
    label: "Children's pendant", category: "Children",
    defaultSize: [.58, .479, .58], bounds: { min: [-.29, -.479, -.29], max: [.29, 0, .29] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "ceiling",
    outlineContact: false, complexity: { visibleMeshes: 40, triangles: 8_000 },
  }),
};

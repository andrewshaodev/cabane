import { defineFurnishingModel } from "@cabane/engine";
import { DesktopMonitor } from "../presets/office/desktop-monitor";
export const desktopMonitorDefinition = defineFurnishingModel({
 component: DesktopMonitor, label: "Desktop monitor", category: "Office", defaultRoomType: "bedroom",
 defaultSize: [0.54,0.42,0.18], bounds: { min: [-0.27,0,-0.09], max: [0.27,0.42,0.09] },
 resizePolicy: { kind: "axes", axes: ["width","height","depth"] }, preferredPlacement: "absolute",
 outlineContact: true, complexity: { visibleMeshes: 4, triangles: 1800 },
});

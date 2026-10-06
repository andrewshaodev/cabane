import { defineFurnishingModel } from "@cabane/engine";
import { DrawerPedestalDesk } from "../presets/office/drawer-pedestal-desk";
export const drawerPedestalDeskDefinition = defineFurnishingModel({
  component: DrawerPedestalDesk,
  label: "Drawer pedestal desk",
  category: "Office",
  defaultRoomType: "bedroom",
  defaultSize: [1.8, 0.75, 0.6],
  bounds: { min: [-0.9, 0, -0.3], max: [0.9, 0.75, 0.3] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 23, triangles: 10000 },
});

import type { DeviceModelBounds, SceneItemSpec, SceneModelEditorDescriptor } from "@cabane/engine";

/** Keeps an unresolved item editable until its real model is imported. */
export const missingModelEditorDescriptor = (
  item: Pick<SceneItemSpec, "modelId" | "placement" | "size">,
): SceneModelEditorDescriptor => {
  const [width, height, depth] = item.size;
  const bounds: DeviceModelBounds =
    item.placement.kind === "ceiling"
      ? { min: [-width / 2, -height, -depth / 2], max: [width / 2, 0, depth / 2] }
      : item.placement.kind === "wall"
        ? {
            min: [-width / 2, -height / 2, -depth / 2],
            max: [width / 2, height / 2, depth / 2],
          }
        : { min: [-width / 2, 0, -depth / 2], max: [width / 2, height, depth / 2] };
  return {
    defaultRoomType: "living-room",
    label: `Missing model · ${item.modelId}`,
    category: "Missing model",
    defaultSize: item.size,
    bounds,
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement:
      item.placement.kind === "wall"
        ? "wall"
        : item.placement.kind === "ceiling"
          ? "ceiling"
          : "absolute",
    outlineContact: false,
    complexity: { visibleMeshes: 1, triangles: 12 },
  };
};

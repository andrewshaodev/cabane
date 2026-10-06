import { DEFAULT_WALL_COLORS } from "@cabane/engine";
import type { EditorWall } from "@cabane/engine";
import type { ConstructEditorController } from "./useConstructEditor";
import { DebouncedColorInput } from "./DebouncedColorInput";

export function WallFinishFields({
  editor,
  wall,
  isExterior,
}: {
  editor: ConstructEditorController;
  wall: EditorWall;
  isExterior: boolean;
}) {
  const custom = wall.edgeColor !== undefined;
  return (
    <fieldset>
      <legend>Finish</legend>
      {isExterior && (
        <label>
          Exterior
          <DebouncedColorInput
            label="Wall exterior color"
            value={wall.exteriorColor ?? editor.defaultExteriorWallColor}
            onCommit={(exteriorColor) => {
              editor.setExteriorWallColor(exteriorColor);
              editor.updateSelectedWallMetadata({ exteriorColor });
            }}
          />
        </label>
      )}
      <label>
        Edge color
        <select
          aria-label="Wall edge color mode"
          value={custom ? "custom" : "auto"}
          onChange={(event) =>
            editor.updateSelectedWallMetadata({
              edgeColor:
                event.target.value === "auto"
                  ? undefined
                  : wall.faceColors?.left && wall.faceColors.left === wall.faceColors.right
                    ? wall.faceColors.left
                    : (wall.exteriorColor ?? DEFAULT_WALL_COLORS.interior),
            })
          }
        >
          <option value="auto">Auto</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {custom && (
        <label>
          Color
          <DebouncedColorInput
            label="Wall edge color"
            value={wall.edgeColor!}
            onCommit={(edgeColor) => editor.updateSelectedWallMetadata({ edgeColor })}
          />
        </label>
      )}
    </fieldset>
  );
}

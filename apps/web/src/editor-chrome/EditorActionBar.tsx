import { DecorationsTools } from "./DecorationsTools";
import type { FloorEditorTool } from "@cabane/engine";
import { EditorActionButton } from "./EditorActionButton";

const constructionTools = [
  { tool: "select", label: "Select", key: "V" },
  { tool: "wall", label: "Wall", key: "W" },
  { tool: "door", label: "Door", key: "D" },
  { tool: "window", label: "Window", key: "N" },
  { tool: "passage", label: "Passage", key: "A" },
  { tool: "floor", label: "Floor", key: "F" },
  { tool: "measure", label: "Measure", key: "M" },
] as const;

export interface EditorActionBarProps {
  inert?: boolean | undefined;
  tool: FloorEditorTool;
  onToolChange: (tool: FloorEditorTool) => void;
  onStairs?: () => void;
  stairsActive?: boolean;
  stairsDisabledReason?: string | undefined;
}

export function EditorActionBar({
  inert,
  tool,
  onToolChange,
  onStairs,
  stairsActive,
  stairsDisabledReason,
}: EditorActionBarProps) {
  return (
    <div
      inert={inert}
      className="editor-action-bar"
      role="group"
      data-mode="construct"
      aria-label="Construction actions"
    >
      {constructionTools.flatMap((action) => [
        <EditorActionButton
          key={action.tool}
          icon={action.tool}
          label={action.label}
          showLabel
          pressed={
            !stairsActive &&
            (tool === action.tool || (tool === "platform" && action.tool === "floor"))
          }
          shortcut={action.key}
          keyShortcuts={action.key}
          onClick={() => onToolChange(action.tool)}
        />,
        ...(action.tool === "wall" && onStairs
          ? [
              <EditorActionButton
                key="stairs"
                icon="stairs"
                label="Stairs"
                showLabel
                pressed={stairsActive}
                disabled={Boolean(stairsDisabledReason)}
                disabledReason={stairsDisabledReason}
                onClick={onStairs}
              />,
            ]
          : []),
      ])}
      <DecorationsTools tool={tool} onToolChange={onToolChange} disabled={inert} />
    </div>
  );
}

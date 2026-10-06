import type { FloorEditorTool } from "@cabane/engine";
import { EditorActionButton } from "./EditorActionButton";
import type { EditorMode } from "./EditorModeNav";

const constructionTools = [
  { tool: "select", label: "Select", key: "V" },
  { tool: "wall", label: "Wall", key: "W" },
  { tool: "door", label: "Door", key: "D" },
  { tool: "window", label: "Window", key: "N" },
  { tool: "passage", label: "Passage", key: "A" },
  { tool: "floor", label: "Floor", key: "F" },
  { tool: "hedge", label: "Hedge", key: "H" },
  { tool: "pool", label: "Pool", key: "P" },
  { tool: "measure", label: "Measure", key: "M" },
] as const;

export interface EditorActionBarProps {
  inert?: boolean;
  mode: EditorMode;
  tool: FloorEditorTool;
  onToolChange: (tool: FloorEditorTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onStairs?: () => void;
  stairsActive?: boolean;
  stairsDisabledReason?: string;
}

export function EditorActionBar({
  inert, mode, tool, onToolChange, canUndo, canRedo, onUndo, onRedo, onStairs, stairsActive, stairsDisabledReason,
}: EditorActionBarProps) {
  const constructing = mode === "construct";
  return (
    <div inert={inert} className="editor-action-bar" role="group" data-mode={mode}
      aria-label={constructing ? "Construction actions" : "Edit history"}>
      {constructing && <>
        {constructionTools.flatMap((action) => [<EditorActionButton key={action.tool}
          icon={action.tool} label={action.label} showLabel pressed={!stairsActive && (tool === action.tool || (tool === "platform" && action.tool === "floor"))}
          shortcut={action.key} keyShortcuts={action.key} onClick={() => onToolChange(action.tool)} />,
          ...(action.tool === "wall" && onStairs ? [<EditorActionButton key="stairs" icon="stairs" label="Stairs" showLabel
            pressed={stairsActive} disabled={Boolean(stairsDisabledReason)} disabledReason={stairsDisabledReason} onClick={onStairs} />] : []),
        ])}
        <span className="editor-action-bar__separator" aria-hidden="true" />
      </>}
      <EditorActionButton icon="undo" label="Undo" disabled={!canUndo} onClick={onUndo}
        shortcut="⌘/Ctrl Z"
        keyShortcuts="Control+Z Meta+Z" />
      <EditorActionButton icon="redo" label="Redo" disabled={!canRedo} onClick={onRedo}
        shortcut="⌘/Ctrl Shift Z · Ctrl Y"
        keyShortcuts="Control+Shift+Z Meta+Shift+Z Control+Y" />
    </div>
  );
}

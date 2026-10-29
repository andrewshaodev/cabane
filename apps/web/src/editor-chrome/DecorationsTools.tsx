import type { FloorEditorTool } from "@cabane/engine";
import { EditorToolGroup, type EditorToolOption } from "./EditorToolGroup";

const tools = [
  { tool: "niche", icon: "niche", label: "Niche" },
  { tool: "hedge", icon: "hedge", label: "Boundary", shortcut: "H" },
  { tool: "pool", icon: "pool", label: "Pool", shortcut: "P" },
] as const satisfies readonly EditorToolOption[];

export function DecorationsTools(props: {
  tool: FloorEditorTool;
  disabled?: boolean | undefined;
  onToolChange: (tool: FloorEditorTool) => void;
}) {
  return (
    <EditorToolGroup
      {...props}
      label="Decorations"
      panelLabel="Decoration tools"
      icon="decorations"
      tools={tools}
    />
  );
}

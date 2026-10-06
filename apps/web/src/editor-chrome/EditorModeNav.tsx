import { EditorIcon } from "./EditorIcon";

export type EditorMode = "construct" | "furnish" | "connect";

export function EditorModeNav({ mode, onModeChange }: {
  mode: EditorMode | "shortcuts";
  onModeChange: (mode: EditorMode | "shortcuts") => void;
}) {
  return (
    <nav className="direction-modes" aria-label="Editor mode">
      <button type="button" data-mode="construct" aria-pressed={mode === "construct"}
        onClick={() => onModeChange("construct")}><EditorIcon name="construct" />Construct</button>
      <button type="button" data-mode="furnish" aria-pressed={mode === "furnish"}
        onClick={() => onModeChange("furnish")}><EditorIcon name="furnish" />Arrange</button>
      <button type="button" data-mode="connect" aria-pressed={mode === "connect"}
        onClick={() => onModeChange("connect")}>
        <EditorIcon name="connect" />Connect
      </button>
      <button type="button" data-mode="shortcuts" aria-pressed={mode === "shortcuts"}
        onClick={() => onModeChange("shortcuts")}><EditorIcon name="grid" />Shortcuts</button>
    </nav>
  );
}

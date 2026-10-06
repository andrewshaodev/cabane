import type { EditorMode } from "./EditorModeNav";

const introductions = {
  construct: {
    title: "Construct",
    description: "Draw your floor plan, then select walls, rooms or openings to edit them.",
  },
  furnish: {
    title: "Arrange",
    description: "Choose furniture and devices from the catalog, then place them in your home.",
  },
  connect: {
    title: "Connect",
    description: "Link your rooms and devices to Home Assistant to control them from Home.",
  },
  shortcuts: {
    title: "Shortcuts",
    description: "Customize the action bar on Home with your favorite actions, rooms and devices.",
  },
} satisfies Record<EditorMode | "shortcuts", { title: string; description: string }>;

export function EditorModeIntroduction({ mode }: { mode: EditorMode | "shortcuts" }) {
  const { title, description } = introductions[mode];
  return (
    <header className="editor-mode-introduction">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

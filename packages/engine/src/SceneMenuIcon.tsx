import {
  type ReactNode
} from "react";

type SceneMenuIconName = "workspaces" | "setup" | "shortcuts" | "editor" | "connect" | "retry" | "rooms" | "floor" | "export" | "disconnect" | "feedback" | "preferences";

export function SceneMenuIcon({ name }: { name: SceneMenuIconName }) {
  const paths: Record<SceneMenuIconName, ReactNode> = {
    preferences: <><path d="M10.3 3.2h3.4l.5 2.1a7.2 7.2 0 0 1 1.5.9l2-.7 1.7 2.9-1.5 1.5a7.7 7.7 0 0 1 0 1.8l1.5 1.5-1.7 2.9-2-.7a7.2 7.2 0 0 1-1.5.9l-.5 2.1h-3.4l-.5-2.1a7.2 7.2 0 0 1-1.5-.9l-2 .7-1.7-2.9 1.5-1.5a7.7 7.7 0 0 1 0-1.8L4.6 8.4l1.7-2.9 2 .7a7.2 7.2 0 0 1 1.5-.9z" transform="translate(0 1)" /><circle cx="12" cy="12" r="2.5" /></>,
    shortcuts: <><rect x="2" y="7" width="20" height="10" rx="3" /><path d="M7 10v4M12 10v4M17 10v4" /></>,
    editor: <><path d="m4 16-1 5 5-1L21 7l-4-4Z" /><path d="m14 6 4 4M4 16l4 4" /></>,
    feedback: <><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 13h6" /></>,
    workspaces: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    setup: <><path d="M6 4.5h12v15H6z" /><path d="m9 9 1.4 1.4L13 7.8M9 15h6" /></>,
    connect: <><path d="M8 12h8M10 8v4M14 8v4M9 4h6v4H9zM7 12v3a5 5 0 0 0 10 0v-3" /></>,
    retry: <><path d="M19 8a7.5 7.5 0 1 0 .5 7" /><path d="M19 3v5h-5" /></>,
    rooms: <><path d="M4 19V7l8-3 8 3v12" /><path d="M4 10h16M12 4v15M7.5 14h1M15.5 14h1" /></>,
    floor: <><path d="M4 5h16v14H4zM9 5v6h5v8" /><path d="m15.5 9.5 4-4 1 1-4 4-2 .5z" /></>,
    export: <><path d="M5 14v5h14v-5M12 16V4M8.5 7.5 12 4l3.5 3.5" /></>,
    disconnect: <><path d="M8 12h8M10 8v4M14 8v4M9 4h6v4H9zM7 12v3a5 5 0 0 0 8.5 3.5" /><path d="m17 16 4 4M21 16l-4 4" /></>,
  };
  return (
    <span className="scene-menu__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{paths[name]}</svg>
    </span>
  );
}

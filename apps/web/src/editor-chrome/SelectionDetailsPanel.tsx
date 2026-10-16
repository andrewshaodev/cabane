import "./selection-details.css";
import type { ReactNode } from "react";
import { EditorActionButton } from "./EditorActionButton";

/** A shared, nonmodal inspector. Automatic selection must retain canvas focus. */
export function SelectionDetailsPanel({
  children,
  title,
  subtitle,
  label,
  mode = "furnish",
  onClose,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  label: string;
  mode?: "construct" | "furnish";
  onClose: () => void;
}) {
  return (
    <aside id="editor-properties" className="selection-details" data-mode={mode} aria-label={label}>
      <header className="selection-details__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <EditorActionButton icon="chevron" label="Collapse properties" onClick={onClose} />
      </header>
      <div className="selection-details__body furnishing-editor-inspector">
        <section>{children}</section>
      </div>
    </aside>
  );
}

import { useCabaneDom } from "@cabane/engine";
import "./selection-details.css";
import { useEffect, useRef, type ReactNode } from "react";
import { EditorActionButton } from "./EditorActionButton";

export function SelectionDetailsPanel({ children, title, subtitle, label, mode = "furnish", onClose }: {
  children: ReactNode;
  title: string;
  subtitle: string;
  label: string;
  mode?: "construct" | "furnish";
  onClose: () => void;
}) {
  const dom = useCabaneDom();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = dom.root.activeElement instanceof HTMLElement ? dom.root.activeElement : null;
    panel.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <aside ref={panel} className="selection-details" data-mode={mode} aria-label={label} tabIndex={-1}
    onKeyDown={(event) => {
      if (event.key === "Escape" && (event.target as HTMLElement).tagName !== "INPUT") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }}>
    <div className="furnishing-editor-inspector">
      <section>
        <header>
          <div><small>{subtitle}</small><strong>{title}</strong></div>
          <EditorActionButton icon="close" label="Close details" onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  </aside>;
}

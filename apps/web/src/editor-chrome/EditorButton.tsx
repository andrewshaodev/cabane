import type { ButtonHTMLAttributes } from "react";
import "./editor-button.css";

/** Shared editor text actions: secondary for ordinary actions, primary for confirmation,
 * text for lower-emphasis actions. Keep appearance and interaction states in editor-button.css;
 * callers should only customize layout. Icon tools and option tiles use their own controls. */
export function EditorButton({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
}) {
  return (
    <button
      {...props}
      type={type}
      className={`editor-button ${className}`.trim()}
      data-variant={variant}
    />
  );
}

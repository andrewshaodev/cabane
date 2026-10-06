import type { ButtonHTMLAttributes } from "react";
import "./editor-button.css";

/** Shared text actions for the editor header and sidebar. */
export function EditorButton({ variant = "secondary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
}) {
  return <button {...props} type={type} className={`editor-button ${className}`.trim()} data-variant={variant} />;
}

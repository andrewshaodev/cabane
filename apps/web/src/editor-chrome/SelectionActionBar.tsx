import { forwardRef, type ReactNode } from "react";

export const SelectionActionBar = forwardRef<HTMLDivElement, {
  children: ReactNode;
  label: string;
  mode?: "construct" | "furnish";
}>(function SelectionActionBar({ children, label, mode = "furnish" }, ref) {
  return <div ref={ref} className="selected-item-actions" data-mode={mode} role="group" aria-label={label}
    onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
    {children}
  </div>;
});

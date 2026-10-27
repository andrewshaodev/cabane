import "./editor-switch.css";

export function EditorSwitch({
  id,
  labelledBy,
  describedBy,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  labelledBy: string;
  describedBy?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      className="editor-switch"
      role="switch"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span aria-hidden="true" />
    </button>
  );
}

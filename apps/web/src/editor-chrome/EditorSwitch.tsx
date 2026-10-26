import "./editor-switch.css";

export function EditorSwitch({
  id,
  labelledBy,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  labelledBy: string;
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
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span aria-hidden="true" />
    </button>
  );
}

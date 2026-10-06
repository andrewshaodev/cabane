import "./ConstructionMeasureOverlay.css";

export function ConstructionDistanceLabel({
  label,
  ariaLabel = "Measurement",
  copyText = label,
  onCopy,
}: {
  label: string;
  ariaLabel?: string;
  copyText?: string;
  onCopy?: (value: string) => void;
}) {
  return onCopy ? (
    <button
      type="button"
      className="construction-measure-label"
      aria-label={`Copy measurement: ${label}`}
      title="Copy measurement"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onCopy(copyText);
      }}
    >
      {label}
    </button>
  ) : (
    <output className="construction-measure-label" aria-label={ariaLabel}>
      {label}
    </output>
  );
}

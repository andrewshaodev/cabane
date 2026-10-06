import { useRef, type ReactNode } from "react";
import { DeviceCategoryIcon } from "../DeviceCategoryIcon";

export type DeviceMappingActivationInput = "pointer" | "keyboard";

export function DeviceMappingRelationshipCard({
  relationshipId,
  domain,
  connected,
  label,
  targetLabel,
  disabled,
  selected,
  onOpen,
  onTriggerElement,
  preview,
}: {
  preview?: ReactNode;
  relationshipId: string;
  domain: string;
  connected: boolean;
  label: string;
  targetLabel: string;
  disabled: boolean;
  selected: boolean;
  onOpen: (input: DeviceMappingActivationInput) => void;
  onTriggerElement?: (element: HTMLButtonElement | null) => void;
}) {
  const pointerActivation = useRef(false);

  return (
    <article
      className="device-mapping-row"
      data-relationship-id={relationshipId}
      data-selected={selected ? "true" : "false"}
      data-connection-state={connected ? "connected" : "empty"}
    >
      <button
        ref={onTriggerElement}
        type="button"
        className="device-mapping-row__trigger"
        disabled={disabled}
        aria-label={`${label}. Home Assistant: ${targetLabel}. ${disabled ? "Mapping unavailable." : "Select to edit."}`}
        onPointerDown={() => { pointerActivation.current = true; }}
        onClick={() => {
          const input = pointerActivation.current ? "pointer" : "keyboard";
          pointerActivation.current = false;
          onOpen(input);
        }}
      >
        {preview ?? <span
          className={`device-mapping-row__icon is-${domain}${connected ? " is-connected" : ""}`}
          aria-hidden="true"
        >
          <DeviceCategoryIcon domain={domain} className="device-mapping-row__glyph" />
        </span>}
        <span className="device-mapping-row__identity">
          <strong>{label}</strong>
        </span>
        <span className="device-mapping-row__target">
          <strong>{targetLabel}</strong>
        </span>
        <svg className="device-mapping-row__arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
    </article>
  );
}

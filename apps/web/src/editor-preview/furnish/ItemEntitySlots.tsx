import { useState } from "react";
import {
  isAuxiliaryEntitySlot,
  createBrowserUuid,
  type EntityBindingSlotSpec,
  type SceneItemSpec,
} from "@cabane/engine";
import { EditorButton } from "../../editor-chrome/EditorButton";
import { EditorIcon } from "../../editor-chrome/EditorIcon";
import "./item-entity-slots.css";

const READING_TYPES = {
  temperature: { label: "Temperature", domain: "sensor", deviceClass: "temperature" },
  power: { label: "Power", domain: "sensor", deviceClass: "power" },
  humidity: { label: "Humidity", domain: "sensor", deviceClass: "humidity" },
  sensor: { label: "Other sensor", domain: "sensor" },
  binary_sensor: { label: "Binary sensor", domain: "binary_sensor" },
} as const;

export function ItemEntitySlots({
  item,
  label,
  onChange,
}: {
  item: SceneItemSpec;
  label: string;
  onChange: (slots: readonly EntityBindingSlotSpec[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<keyof typeof READING_TYPES>("temperature");
  const [name, setName] = useState("");
  const slots = item.entitySlots ?? [];
  const reading = READING_TYPES[kind];
  const add = () => {
    onChange([
      ...slots,
      {
        id: `reading-${createBrowserUuid()}`,
        compatibleDomains: [reading.domain],
        ...("deviceClass" in reading ? { compatibleDeviceClasses: [reading.deviceClass] } : {}),
        deviceRole: "secondary",
        required: false,
        autoMap: "manual",
        presentation: {
          label: name.trim() || `${label} ${reading.label.toLowerCase()}`,
          dashboardRole: "secondary",
          showInScene: true,
        },
      },
    ]);
    setName("");
    setAdding(false);
  };
  if (slots.length === 0 && !adding) {
    return (
      <fieldset className="item-entity-slots">
        <legend>Linked entities</legend>
        <EditorButton onClick={() => setAdding(true)} aria-expanded={false}>
          <EditorIcon name="plus" />
          Add reading
        </EditorButton>
      </fieldset>
    );
  }
  return (
    <fieldset className="item-entity-slots">
      <legend>Linked entities</legend>
      <p>
        Add readings here, then choose their Home Assistant entities in Connect.
        {item.kind === "device" ? " The primary entity controls the device." : ""}
      </p>
      {slots.map((slot) => (
        <div className="item-entity-slots__entry" key={slot.id}>
          <strong>{slot.presentation.label}</strong>
          <label className="item-entity-slots__visibility">
            <input
              type="checkbox"
              checked={slot.presentation.showInScene === true}
              onChange={(event) =>
                onChange(
                  slots.map((candidate) =>
                    candidate.id === slot.id
                      ? {
                          ...candidate,
                          presentation: {
                            ...candidate.presentation,
                            showInScene: event.target.checked,
                          },
                        }
                      : candidate,
                  ),
                )
              }
            />
            Show readings
          </label>
          {isAuxiliaryEntitySlot(slot) && (
            <EditorButton
              variant="text"
              onClick={() => onChange(slots.filter((candidate) => candidate.id !== slot.id))}
              aria-label={`Remove ${slot.presentation.label}`}
            >
              Remove reading
            </EditorButton>
          )}
        </div>
      ))}
      <label className="item-entity-slots__new-reading">
        Reading type
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as keyof typeof READING_TYPES)}
        >
          {Object.entries(READING_TYPES).map(([value, type]) => (
            <option key={value} value={value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label className="item-entity-slots__new-reading">
        Reading name
        <input
          value={name}
          maxLength={80}
          placeholder={`${label} ${reading.label.toLowerCase()}`}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <EditorButton onClick={add}>Add reading</EditorButton>
      {slots.length === 0 && (
        <EditorButton variant="text" onClick={() => setAdding(false)}>
          Cancel
        </EditorButton>
      )}
    </fieldset>
  );
}

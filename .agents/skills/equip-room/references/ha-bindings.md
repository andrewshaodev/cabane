# Runtime Binding Slot Rules

Generated code owns stable local slots. Exact household Home Assistant mapping
belongs exclusively to the authenticated browser's `RuntimeBindingProfile`.

## Generation boundary

Do not request or use Home Assistant MCP, CLI access, registry exports,
credentials, OAuth material, long-lived tokens, area IDs, or entity IDs. Do
not call services or inspect household state even if an HA tool is available.

The room must remain recognizable, navigable, and reviewable while
disconnected and while every slot is unmapped.

## Room identity

Every `RoomSpec` has a stable local room ID and human-facing canonical name,
but no HA area ID. After browser OAuth, the runtime may automatically map an
exact canonical-name area only when it is uniquely unclaimed. Aliases and fuzzy
names never cause automatic mapping. The owner resolves other rooms manually.

## `DeviceSlotSpec`

Each modeled smart device declares:

- one stable device-slot ID and stable catalog model or home extension;
- placement and support contact in the generated room;
- one or more stable `EntityBindingSlotSpec` entries; and
- exactly one primary entity slot for principal visual state and device
  dashboard navigation.

Each entity slot declares compatible domains, applicable device classes,
whether it is required, `unique-compatible` or `manual` automatic mapping,
and a label/dashboard role. Additional slots may represent secondary controls
or measurements.

V1 control domains are `light`, `switch`, `input_boolean`, `climate`, `cover`,
`fan`, and `media_player`. Read-only slots may use `sensor` and
`binary_sensor`. A stable `camera-screen` uses exactly one required primary
`camera` slot with `unique-compatible` mapping; do not add camera IDs, stream
URLs, or vendor quality-profile slots to generated code. Vacuum entities and
behavior are excluded.

Use the stable AC, speaker, camera screen, switch, contact, thermometer,
motion, and leak models when their form and compatibility fit. Use a home-local
extension for a different recognizable form; ordinary generation does not edit
the catalog.

## Dashboard and opening slots

Use `RoomSpec.dashboardSlots` for useful compatible roles with no modeled
physical object. Do not duplicate an entity role already owned by a device
slot merely to place it in a room section.

A door/window may declare one optional `contactSlot` with a stable ID,
compatible `door`, `window`, and/or `opening` device classes, its open-state
polarity, and an automatic-mapping policy. It never contains a binary-sensor
ID. Multiple generic opening sensors competing for multiple openings must stay
ambiguous at runtime.

## Runtime expectations

Automatic mapping fills only unbound destinations with one compatible,
enabled, visible, available candidate in the exact mapped room area, using
entity-area precedence over device area. It never duplicates a claimed ID,
overwrites a persisted choice, reacts silently to a registry update, or calls
an HA service. The owner may clear, replace, undo, or explicitly rescan.

`camera-screen` is the deliberate spatial exception because it represents the
display location, not the camera location. Its selector lists compatible
cameras across every Home Assistant area (including cameras with no area) and
shows each area name. One screen maps automatically only when one compatible
camera is globally unique; multiple cameras or multiple screens remain
ambiguous for explicit owner selection. Ordinary slots remain room-scoped.

Missing, renamed, incompatible, hidden, disabled, and unavailable exact
profile bindings remain actionable runtime issues while the scene stays
usable. The deliberate `all-lights` shortcut remains the only entity-discovery
exception.

## Evidence checklist

For every room handoff, state:

- each stable modeled-device, dashboard, and contact slot ID;
- compatible domains/device classes and automatic-mapping policy;
- which catalog model or extension and dashboard role use the slot;
- intentionally slot-free visible objects; and
- verification performed for disconnected and mapped fixture states.

Use deterministic fixtures for unique, ambiguous, missing, incompatible, and
unavailable behavior. A live HA lookup is neither required nor appropriate for
generation validation.

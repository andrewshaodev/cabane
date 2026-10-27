export const AGENT_CAPABILITIES = [
  "get_capabilities",
  "inspect_workspace",
  "get_draft_diff",
  "validate_draft",
  "select_floor",
  "dispatch_construct",
  "floor_operation",
  "list_catalog",
  "dispatch_arrange",
  "list_binding_slots",
  "apply_binding",
  "apply_room_mapping",
  "discard_draft",
  "publish_draft",
  "rename_room",
  "undo",
  "redo",
] as const;

/**
 * These are durable construction actions. Selection, camera, tool and history
 * actions stay browser-local; publication and Home Assistant bindings have
 * their own guarded command paths.
 */
export const AGENT_CONSTRUCT_ACTIONS = new Set([
  "add-wall",
  "move-wall-endpoint",
  "translate-wall",
  "update-wall-metadata",
  "delete-elements",
  "add-opening",
  "move-opening",
  "resize-opening",
  "update-opening",
  "update-room-metadata",
  "add-hedge",
  "update-hedge",
  "add-pool",
  "update-pool",
  "add-outdoor-platform",
  "update-outdoor-platform",
  "add-floor-zone",
  "add-ground-zone",
  "update-floor-zone",
  "update-floor-settings",
  "set-floor-name",
]);

export const AGENT_FLOOR_OPERATIONS = new Set([
  "add-top",
  "add-bottom",
  "rename",
  "set-height",
  "remove",
]);

export const AGENT_ARRANGE_ACTIONS = new Set([
  "add-item",
  "update-item",
  "duplicate-item",
  "delete-item",
]);

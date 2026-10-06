# Agent-generated home workflow

Repository instructions separate home generation from product development.
Ordinary generation edits `home/`; changes to the stable web/engine/catalog
packages require a product-development request. The accepted owner's home is
already furnished, so generation should not reset it to a neutral fixture.

The supported workflow skills cover bootstrapping, architectural floor layout,
room-by-room equipment, and reusable catalog presets. Layout work produces the
complete unfurnished floor, including wall-owned openings, junctions, ceilings,
assumptions, and derived-navigation validation. Room equipment follows accepted
architecture and supplies procedural furnishings, visible devices, and typed
local binding slots. Architecture corrections return to the layout review gate.

Generation keeps stable IDs across revisions, records inferred dimensions and
placements as assumptions, and uses one floor-coordinate transform. Plans and
photos are task inputs rather than checked-in runtime assets. Home-local visual
content remains code-native/procedural and uses the public toon vocabulary.
Stable catalog models are preferred where they fit; bespoke reusable geometry
belongs to domain-specific home extensions.

Generation does not authenticate to or inspect HA. Household mapping is a later,
explicit authenticated browser activity. Source plans/photos, credentials,
registry exports, HA histories, camera images, and private household IDs must
not enter generated source. Attachments may be processed by the chosen agent
provider. These are workflow requirements, not claims about new runtime screens.

The prescribed review gates remain an unfurnished floor and each equipped room,
with normal overview/room/walk evidence appropriate to the change. The current
browser editor provides an additional implemented authoring route; its existence
does not remove generation's ownership or review rules.

Authority: [repository instructions](../../AGENTS.md).
Implementation/workflows: [home layout](../../home/src/layout.json),
[furniture and devices](../../home/src/items.json),
[layout validator](../../scripts/validate-floor.mjs),
[home verifier](../../scripts/verify-home.mjs),
[evidence capture](../../scripts/capture-visual-evidence.mjs).

[Back to product overview](../../PRODUCT_SPEC.md).

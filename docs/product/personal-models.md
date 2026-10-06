# Personal GLB models

Arrange offers **My models**, **Import GLB**, and **Download AI skill**. The
catalog belongs to the active home. Import asks for Name, Preferred placement
(Floor, Wall, Ceiling), and Profile (Furniture by default). The preview permits
orientation corrections and uniform resizing in metres. Floor models contact
the ground at their bottom, wall models contact the wall at their back, and
ceiling models contact their support at their top. Placement, selection,
rotation, uniform resizing, duplication, history, Reset, and Save use the normal
editor paths. Floor instances have a simple bounding-envelope walk collider.

Original GLB materials, colours, and embedded textures are preserved. Personal
models receive scene lighting without compulsory toon conversion or contours.
Native procedural models retain their materials, batching, LOD, and outlines.
Animations remain in their initial pose; embedded cameras and lights are ignored
with preview notices. Visual variants driven by HA state are outside this version.
Only the import owner may load personal GLB resources; catalog/home generation
continues to obey the procedural source policy.

Only self-contained GLB 2.0 files are accepted. Images must be embedded; external
and data-URI references are rejected. Unsupported required extensions produce an
explicit error. The loader's supported material/texture extensions are accepted;
required Meshopt, Draco and KTX2 compression are outside the initial import profile.
Resource limits are 10 MiB per file, 100 MiB of distinct assets retained by a
home, 100,000 triangles, and 128 visible meshes per model. These checks impose
no aesthetic restrictions. Invalid files and storage failures leave the scene
and the preceding persisted workspace usable.

Every import allocates an independent `custom:<UUID>` model, including repeated
imports of identical bytes. Identical files share their immutable SHA-256 asset.
Models can be renamed or downloaded; deletion requires no remaining draft
instances. Published and active history references retain their assets even when
a draft removes the corresponding model. Instances share loaded geometry,
materials, and textures while retaining independent transforms and skeletons.
The final resource lease disposes the cache after previews or scenes close.

`HomeProject` V2 optionally contains `customModels`: name, support, existing
profile, asset hash/byte length, normalization, bounds, complexity, and optional
Light source. Projects without it have an empty personal catalog. The public
engine resolves definitions per project before validation and composition;
custom IDs never become a global catalog registration. Binaries occupy the
separate IndexedDB `model-assets` store and never enter project/history JSON.
Asset availability and record publication share one transaction. Draft,
published, and active history references are preserved across edits and Reset.

Device profiles reuse existing HA domains and controls. Each placed or duplicated
device receives a fresh primary local slot. Exact entity IDs remain in private,
origin-scoped binding profiles. Light adds a configurable point source and reuses
brightness, colour, availability, and local scene-light rules. Camera opens the
existing viewer. Sensor, Cover, and the other profiles retain static geometry.
Import and preview never inspect or operate household devices.

Portable projects and private backups download as ZIP `.cabane` archives:
`project.json` plus deduplicated `assets/<sha256>.glb` files. Private documents
retain draft/published boundaries and mappings but exclude credentials. Legacy
JSON remains readable. Imports verify all hashes, sizes, GLB resources, and
references before atomically making the home available; missing files are errors.

The companion HA integration advertises asset protocol version 1 and 256 KiB
blocks through authenticated `cabane/assets/capabilities`. Presence, upload
begin/block/finish, and download commands use SHA-256 addressing. Absent files
upload before the workspace document; later placement edits only update the
document. Documents retain the 5 MiB limit and revision conflict checks. A failed
or interrupted upload does not replace the preceding document. Download verifies
files locally before restoring the record. Storage calls remain bound to the
authenticated session and HA origin. SHA-256 verification also works in native
HTTP panels without SubtleCrypto, using the same content identities as HTTPS.
Older integrations continue to support
native homes and ask for an update for homes containing GLB references.
Unreferenced remote files and abandoned transfers expire after 24 hours; cleanup
preserves assets referenced by any stored draft or published home.

The downloadable `create-cabane-model` skill contains `SKILL.md`, export guidance,
standalone Blender and Three.js examples, and a local Python validator. It emits
a standard GLB without Cabane source or an additional manifest. Simplified
proportions, a restrained palette, and Cabane-like finishes are defaults; explicit
style preferences take precedence. Final validation also uses the Cabane import
preview. Reference photos and household HA data are not deliverables.

Implementation: [import owner](../../packages/engine/src/imported-models/index.ts),
[Arrange library](../../apps/web/src/custom-models/CustomModelLibrary.tsx),
[HA asset client](../../apps/web/src/workspaces/ha-model-assets.ts),
[portable skill](../../.agents/skills/create-cabane-model/SKILL.md).

[Back to product overview](../../PRODUCT_SPEC.md).

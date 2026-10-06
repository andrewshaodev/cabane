# Private workspace JSON authoring

Use this route when the user supplies a Cabane project or workspace backup.
The repository's `home/` is the bundled demo, not the imported household.

- Keep the original backup untouched. Save a private working copy outside Git
  in a durable task artifact location. Do not commit plans, photos, household
  mappings, credentials or runtime profiles; catalog PRs contain reusable code
  and public documentation only.
- Inspect the current schema and public import/export implementation. Edit the
  requested room's `sceneItems`, authorized room finish, and relevant assumptions
  in `record.draft`. Preserve room/wall/opening/item/slot IDs and unrelated rooms,
  architecture, metadata, binding profiles and `record.published`. Advance the
  draft revision/timestamp using the current record contract. Do not infer
  household mappings or inspect Home Assistant.
- Before placement, record the photo-to-plan wall map and key uncertainties.
  Use full resized/rotated model envelopes, actual wall finish planes, ceiling
  heights and door sweeps. Check that each complete footprint stays in the
  accepted room: simply mirroring coordinates can put a cabinet into a notch
  or adjacent bathroom. Recalculate contacts after orientation corrections.
- Prefer direct JSON edits for dimensions, placement and repeated modules; use
  the normal UI for import, visual inspection and the owner's review. Match the
  photographed door counts with model variants or suitable presets, not only
  with overall dimensions. Use the existing parquet presets when authorized;
  do not approximate a patterned floor with a uniform beige fill.
- Validate the actual private project through public parsers and registries.
  Assert that unrelated room data, openings, published state and bindings remain
  unchanged. Run applicable catalog checks separately from private project checks.
- Create one disconnected local review workspace and update that workspace on
  subsequent corrections through its supported import/editor flow. Avoid a new
  library entry for every screenshot or iteration. Keep HA URLs/credentials out
  of the preview copy. If needed, alter walkStart in the preview copy only to
  begin inside the target room; preserve the owner's saved starting point.
- Full-backup replacement can reject a different `homeId`. Align only the
  disconnected preview copy's record and project home identities to the existing
  local review workspace, including any empty profile identities as required by
  the current schema. Preserve the original home ID in the durable private
  working backup. Do not solve an identity error by creating another review home.
- A backup can contain both draft and published versions. Importing it does not
  prove the dashboard is showing the edited draft. Review in Arrange/Explore,
  then use the local Save flow when appropriate. A disconnected preview may use
  the edited project as its local published view; distinguish it from the private
  working backup, whose published state stays intact until explicitly applied.
- Show overview, photo-like room angles, eye-level walk and changed contacts.
  Check visible parquet and lights as well as furniture. If the browser cannot
  provide pointer lock or an evidence tool targets only the demo, report that
  precise limit instead of repeatedly importing copies or claiming full review.
- Deliver the durable private JSON checkpoint, catalog PR if requested, actual
  checks and remaining room-specific uncertainty. Keep the working checkpoint
  for subsequent rooms. Final re-export/re-import to the user's live Cabane
  happens at the stage requested by the user, after required models are deployed.

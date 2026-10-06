# Publication and imported history

Cabane is source-available under [PolyForm Noncommercial 1.0.0](../LICENSE).

## Imported history

The public repository begins with a sanitised import snapshot followed by a
selected recent development graph. Imported author and committer dates use an
artificial sequence for privacy. They record logical ordering, not working days,
hours or the duration of development. Imported hashes and signatures differ from
the private originals. Future public commits use ordinary dates.

Personal author email addresses have been replaced with public no-reply addresses.
Development logs and private material have been removed throughout the imported
history. The original archive and commit mapping remain private. This import does
not recall rights granted for any copies previously distributed under other terms.

## Before publication

- Verify a complete private backup by restoring it and comparing commits and refs.
- Audit every retained snapshot and commit message, including deleted files and
  binary metadata. Keep public attribution and required licence notices explicit.
- Check the new repository from a fresh clone with no shared object store. Publish
  only the reviewed main branch; keep private refs and maps out.
- Run `npm ci`, the pinned browser install, `npm run verify`, and the native panel
  build/verifier. Inspect distribution licences and the panel file inventory.
- Create the independent `cabane-app/cabane` repository only after reviewing the
  export. Retain the existing repository and hosted records privately.
- Enable private vulnerability reporting. Require the `Verify` status check and
  maintainer review for main.
- Configure the scoped integration deploy key in the new repository before
  enabling its release workflow. Source URLs can be enabled in onboarding only
  after the destination is public and verified.

## Distribution and hosting cutover

The frontend licence and notices must accompany both standalone and native panel
builds. The companion Home Assistant integration keeps its own licence; describe
the integration and bundled frontend scopes separately in its release materials.

A frontend licence change does not change the workspace compatibility fingerprint
and therefore does not automatically release an integration update. Prepare an
explicit panel/integration release; do not change a schema revision to trigger one.
Repoint hosting and release configuration only as part of the reviewed cutover.
Repository publication, integration releases and production deployment are separate
delivery steps.

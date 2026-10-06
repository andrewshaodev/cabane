import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
// Include model dependencies and rendering code so deployed previews never go stale.
export function thumbnailRevision() {
  const hash = createHash("sha256");
  const root = fileURLToPath(new URL("../../", import.meta.url));
  function visit(path) {
    for (const item of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const child = join(path, item.name);
      if (item.isDirectory()) visit(child);
      else {
        hash.update(item.name);
        hash.update(readFileSync(child));
      }
    }
  }
  for (const dir of ["apps/web/src", "packages/engine/src", "packages/catalog/src", "home/src"])
    visit(join(root, dir));
  hash.update(readFileSync(join(root, "package-lock.json")));
  return hash.digest("hex").slice(0, 20);
}

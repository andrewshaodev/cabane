import { readFileSync } from "node:fs";
import { bundledDependencyNotices } from "../../scripts/distribution-notices.mjs";

export function distributionNotices() {
  return {
    name: "cabane-distribution-notices",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const fileName of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) {
        this.emitFile({
          type: "asset",
          fileName,
          source: readFileSync(new URL(`../../${fileName}`, import.meta.url), "utf8"),
        });
      }
      this.emitFile({
        type: "asset",
        fileName: "THIRD_PARTY_LICENSES.txt",
        source: bundledDependencyNotices(Object.values(bundle)),
      });
    },
  };
}

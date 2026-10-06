import { fileURLToPath } from "node:url";
import { generateEngineeringMap } from "./engineering-map/generate.mjs";

await generateEngineeringMap(fileURLToPath(new URL("../", import.meta.url)), {
  write: process.argv.includes("--write"),
});

import { readFile } from "node:fs/promises";

// These three files are authoring slices of HomeProject, not a second schema.
const read = async (name) =>
  JSON.parse(await readFile(new URL(`../home/src/${name}.json`, import.meta.url), "utf8"));
const [metadata, layout, sceneItems] = await Promise.all([
  read("project"),
  read("layout"),
  read("items"),
]);
process.stdout.write(`${JSON.stringify({ ...metadata, ...layout, sceneItems }, null, 2)}\n`);

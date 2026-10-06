import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const baselineBytes = 1_176_960;
const assetsDirectory = join(process.cwd(), "apps/web/dist/assets");
const javascriptFiles = (await readdir(assetsDirectory))
  .filter((file) => file.endsWith(".js"));
const totalBytes = (await Promise.all(
  javascriptFiles.map(async (file) => (await stat(join(assetsDirectory, file))).size),
)).reduce((total, size) => total + size, 0);
const growth = totalBytes - baselineBytes;

console.log(
  `Production JavaScript is ${totalBytes} bytes (${growth >= 0 ? "+" : ""}${growth} from the historical baseline; informational only).`,
);

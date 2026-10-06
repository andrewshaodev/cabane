import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const arguments_ = process.argv.slice(2);
const jsonOutput = arguments_.includes("--json");
const flags = arguments_.filter((argument) => argument.startsWith("--"));
const paths = arguments_.filter((argument) => !argument.startsWith("--"));
const unsupportedFlag = flags.find((flag) => flag !== "--json");
const requestedPath = paths.length === 1 ? paths[0] : undefined;

const writeResult = (result, status) => {
  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.valid) {
    console.log(
      `Validated layout floor "${result.floorId}": ${result.counts.rooms} rooms, ` +
        `${result.counts.walls} walls, ${result.counts.openings} openings.`,
    );
    console.log("FLOOR_VALID");
  } else {
    result.issues.forEach((issue) => {
      console.error(`${issue.path} [${issue.code}]: ${issue.message}`);
    });
  }
  process.exitCode = status;
};

if (!requestedPath || unsupportedFlag) {
  writeResult(
    {
      valid: false,
      file: null,
      issues: [
        {
          code: "floor.arguments",
          path: "$",
          message: unsupportedFlag
            ? `Unsupported option "${unsupportedFlag}". Usage: home:validate-floor -- <floor.json> [--json].`
            : "Provide exactly one FloorSpec JSON path.",
          severity: "fatal",
        },
      ],
    },
    1,
  );
} else {
  const file = resolve(process.cwd(), requestedPath);
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch (error) {
    writeResult(
      {
        valid: false,
        file,
        issues: [
          {
            code: "floor.file.read",
            path: "$",
            message: error instanceof Error ? error.message : String(error),
            severity: "fatal",
          },
        ],
      },
      1,
    );
  }

  let input;
  if (source !== undefined) {
    try {
      input = JSON.parse(source);
    } catch (error) {
      writeResult(
        {
          valid: false,
          file,
          issues: [
            {
              code: "floor.json.parse",
              path: "$",
              message: error instanceof Error ? error.message : String(error),
              severity: "fatal",
            },
          ],
        },
        1,
      );
    }
  }

  if (input !== undefined) {
    let server;
    try {
      server = await createServer({
        root: process.cwd(),
        appType: "custom",
        configFile: false,
        logLevel: "silent",
        server: { middlewareMode: true, hmr: false },
        optimizeDeps: { noDiscovery: true },
      });
      const { validateLayoutFloorSpec } = await server.ssrLoadModule(
        "/packages/engine/src/home-editor/construct/layout-validation.ts",
      );
      const validation = validateLayoutFloorSpec(input);
      if (validation.valid && validation.floor) {
        writeResult(
          {
            valid: true,
            status: "FLOOR_VALID",
            file,
            floorId: validation.floor.id,
            counts: {
              rooms: validation.floor.rooms.length,
              walls: validation.floor.walls.length,
              openings: validation.floor.openings.length,
            },
            issues: [],
          },
          0,
        );
      } else {
        writeResult({ valid: false, file, issues: validation.issues }, 1);
      }
    } finally {
      await server?.close();
    }
  }
}

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
// Explicit target: the existing shared, loopback-only test container. Preserve its volume/account.
const container = "cabane-ha-dev-homeassistant-1";
const run = (...a) => execFileSync("docker", a, { stdio: "inherit" });
const mounts = JSON.parse(
  execFileSync("docker", ["inspect", container, "--format", "{{json .Mounts}}"], {
    encoding: "utf8",
  }),
);
const config = mounts.find((m) => m.Destination === "/config/configuration.yaml")?.Source;
if (!config?.endsWith("/cabane/dev/home-assistant/configuration.yaml"))
  throw Error("Unexpected test configuration mount");
const ports = JSON.parse(
  execFileSync("docker", ["inspect", container, "--format", "{{json .HostConfig.PortBindings}}"], {
    encoding: "utf8",
  }),
);
if (ports["8123/tcp"]?.[0]?.HostIp !== "127.0.0.1") throw Error("Refusing a non-loopback HA");
run(
  "cp",
  resolve("dev/home-assistant/showcase/solstice"),
  `${container}:/config/custom_components/`,
);
if (existsSync("test-results/showcase/runtime-plan.json"))
  run(
    "cp",
    resolve("test-results/showcase/runtime-plan.json"),
    `${container}:/config/custom_components/solstice/runtime-plan.json`,
  );
const old = await readFile(config, "utf8");
if (!/^solstice:/m.test(old))
  await writeFile(config, old + "\n# Local-only Casa Solstice showcase entities.\nsolstice:\n");
run(
  "exec",
  container,
  "python",
  "-m",
  "homeassistant",
  "--script",
  "check_config",
  "--config",
  "/config",
);
run("restart", container);
console.log("Synthetic setup installed. Account and persistent volume retained.");

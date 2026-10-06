import { startFixtureServer, serverOrigin } from "./fixture-server.mjs";

const valueAfter = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const stage = valueAfter("--stage") ?? "room";
const scenario = valueAfter("--scenario") ?? "disconnected";
if (!["layout", "room", "scale"].includes(stage)) {
  throw new Error("Fixture preview stage must be layout, room, or scale.");
}
if (!["disconnected", "connected", "unavailable"].includes(scenario)) {
  throw new Error("Fixture preview scenario must be disconnected, connected, or unavailable.");
}

const server = await startFixtureServer();
const url = `${serverOrigin(server)}/tests/agent-harness.html?stage=${stage}&scenario=${scenario}`;
console.log(`Fixture preview ready: ${url}`);
console.log("Press Ctrl+C to stop. This command does not start the next workflow stage.");

const stop = async () => {
  await server.close();
  process.exit(0);
};
process.once("SIGINT", () => {
  void stop();
});
process.once("SIGTERM", () => {
  void stop();
});
await new Promise(() => undefined);

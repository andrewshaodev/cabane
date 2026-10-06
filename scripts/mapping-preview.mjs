import { startFixtureServer, serverOrigin } from "./fixture-server.mjs";

const server = await startFixtureServer();
const url = `${serverOrigin(server)}/tests/agent-harness.html?stage=room&scenario=mapping`;
const scaleUrl = `${serverOrigin(server)}/tests/agent-harness.html?stage=scale&scenario=mapping-scale`;

console.log(`Home Assistant mapping playground ready: ${url}`);
console.log(`Representative 20-room mapping playground: ${scaleUrl}`);
console.log("Press Ctrl+C to stop.");

const stop = async () => {
  await server.close();
  process.exit(0);
};

process.once("SIGINT", () => { void stop(); });
process.once("SIGTERM", () => { void stop(); });
await new Promise(() => undefined);

import { startBridge } from "./bridge-server.mjs";
import { baseUrl, fetchJson, option, requiredOption, requestAgent } from "./bridge-client.mjs";

function printResult(result, args) {
  console.log(JSON.stringify(result, null, args.includes("--pretty") ? 2 : 0));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "bridge") {
    await startBridge();
    return;
  }
  if (command === "status") {
    printResult(await fetchJson(`${baseUrl(args)}/status`), args);
    return;
  }
  if (command === "inspect") {
    printResult(await requestAgent(args, "inspect_workspace", {}), args);
    return;
  }
  if (command === "validate") {
    printResult(await requestAgent(args, "validate_draft", {}), args);
    return;
  }
  if (command === "undo" || command === "redo") {
    printResult(await requestAgent(args, "execute_action", { action: { type: command } }), args);
    return;
  }
  if (command === "rename-room") {
    const params = {
      roomId: requiredOption(args, "--room-id"),
      name: requiredOption(args, "--name"),
      ...(option(args, "--floor-id") ? { floorId: option(args, "--floor-id") } : {}),
      ...(option(args, "--expected-revision")
        ? { expectedRevision: Number(option(args, "--expected-revision")) }
        : {}),
    };
    const { floorId, expectedRevision, ...action } = params;
    if (
      expectedRevision !== undefined &&
      (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    )
      throw new Error("--expected-revision must be a non-negative integer.");
    printResult(
      await requestAgent(args, "execute_action", {
        action: { type: "rename-room", ...action, ...(floorId ? { floorId } : {}) },
        ...(expectedRevision === undefined ? {} : { expectedRevision }),
      }),
      args,
    );
    return;
  }
  if (command === "request") {
    const method = requiredOption(args, "--method");
    const paramsText = option(args, "--params") ?? "{}";
    let params;
    try {
      params = JSON.parse(paramsText);
    } catch {
      throw new Error("--params must be valid JSON.");
    }
    printResult(await requestAgent(args, method, params), args);
    return;
  }
  console.log(`Usage:
  cabane-agent bridge
  cabane-agent status [--url http://127.0.0.1:4317]
  cabane-agent inspect [--pretty]
  cabane-agent validate [--pretty]
  cabane-agent rename-room --room-id ROOM_ID --name "New name"
  cabane-agent undo | redo
  cabane-agent request --method METHOD --params '{"key":"value"}'

Methods include get_capabilities, inspect_workspace, get_draft_diff, validate_draft,
list_catalog, list_binding_slots and execute_action. Use get_capabilities to discover
the public action types and their parameters.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

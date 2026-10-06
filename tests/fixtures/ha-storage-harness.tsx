import { createRoot } from "react-dom/client";
import { HomeAssistantRuntimeValueProvider, createWorkspaceRepository } from "@cabane/engine";
import { ownerProjectRegistries } from "../../apps/web/src/project-runtime";
import { WorkspaceHaStorage } from "../../apps/web/src/workspaces/WorkspaceHaStorage";

export async function mountHaStorageHarness() {
  const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
  const entry = await repository.createBlank("Synced room");
  let remote: { version: number; document: string } | null = null;
  const runtime = {
    status: "connected", origin: "https://ha.test", configured: true,
    sendStorageMessage: async (message: Record<string, unknown>) => {
      if (message.type === "cabane/workspaces/get") return remote;
      if (message.type === "cabane/workspaces/put") {
        if ((remote?.version ?? null) !== message.expected_version) throw { code: "conflict" };
        remote = { version: (remote?.version ?? 0) + 1, document: message.document as string };
        return remote.version;
      }
      if (message.type === "cabane/workspaces/delete") { remote = null; return null; }
      if (message.type === "cabane/workspaces/list") return [];
      throw { code: "unknown_command" };
    },
  };
  const container = document.createElement("div");
  document.body.append(container);
  createRoot(container).render(<HomeAssistantRuntimeValueProvider value={runtime as never}>
    <WorkspaceHaStorage id={entry.metadata.id} origin="https://ha.test" repository={repository} />
  </HomeAssistantRuntimeValueProvider>);
  return { id: entry.metadata.id, getRemoteVersion: () => remote?.version ?? null, repository };
}

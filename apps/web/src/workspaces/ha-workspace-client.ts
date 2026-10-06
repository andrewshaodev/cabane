export class HaWorkspaceConflictError extends Error {
  constructor() { super("This workspace changed on Home Assistant."); this.name = "HaWorkspaceConflictError"; }
}

export class HaWorkspaceUnavailableError extends Error {
  constructor() { super("Cabane workspace storage is not installed on this Home Assistant instance."); this.name = "HaWorkspaceUnavailableError"; }
}

export interface HaWorkspaceSummary { home_id: string; name: string; version: number }
export interface HaWorkspaceDocument { version: number; document: string }
export type StorageMessage = { type: string; [key: string]: unknown };
export type StorageSender = <T>(message: StorageMessage) => Promise<T>;

const codeOf = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return undefined;
};

export function createHaWorkspaceClient(send: StorageSender) {
  const request = async <T>(message: StorageMessage): Promise<T> => {
    try { return await send<T>(message); }
    catch (error) {
      const code = codeOf(error);
      if (code === "conflict") throw new HaWorkspaceConflictError();
      if (["unknown_command", "unknown_error", "not_found"].includes(code ?? "")) throw new HaWorkspaceUnavailableError();
      throw error;
    }
  };
  return {
    list: () => request<HaWorkspaceSummary[]>({ type: "cabane/workspaces/list" }),
    get: (homeId: string) => request<HaWorkspaceDocument | null>({ type: "cabane/workspaces/get", home_id: homeId }),
    put: (homeId: string, document: string, expectedVersion: number | null) => request<number>({
      type: "cabane/workspaces/put", home_id: homeId, document, expected_version: expectedVersion,
    }),
    delete: (homeId: string, expectedVersion: number) => request<null>({
      type: "cabane/workspaces/delete", home_id: homeId, expected_version: expectedVersion,
    }),
  };
}
export type HaWorkspaceClient = ReturnType<typeof createHaWorkspaceClient>;

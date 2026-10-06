import { createContext, useContext, type ReactNode } from "react";

/** Host-owned home storage. Tool packages own the versioned JSON in their namespace. */
export interface WalkToolStorage {
  read: (toolId: string) => unknown;
  write: (toolId: string, value: unknown) => Promise<void>;
}
const StorageContext = createContext<WalkToolStorage | undefined>(undefined);
export function WalkToolStorageProvider({
  storage,
  children,
}: {
  storage: WalkToolStorage;
  children: ReactNode;
}) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
export const useWalkToolStorage = () => useContext(StorageContext);

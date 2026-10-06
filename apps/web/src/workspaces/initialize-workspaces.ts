import { createWorkspaceRepository } from "@cabane/engine";
import { ownerHomeProject } from "@cabane/home";
import { ownerProjectRegistries } from "../project-runtime";
import { migrateSingleHomeStorage, singleHomeUrl } from "./migrate-single-home-storage";

export async function initializeWorkspaces(factory: IDBFactory, storage: Storage) {
  const repository = createWorkspaceRepository(factory, ownerProjectRegistries);
  let migrationError: string | undefined;
  let previousOrigin: string | null = null;
  try { if (!await repository.migrationDone()) previousOrigin = singleHomeUrl(storage); }
  catch (error) { migrationError = error instanceof Error ? error.message : "Saved connection data needs recovery."; }
  const demo = { ...ownerHomeProject, home: { ...ownerHomeProject.home, name: "Demo home" } };
  await repository.initialize(demo, previousOrigin);
  try { await migrateSingleHomeStorage(repository, ownerHomeProject.home.id, storage); }
  catch (error) { migrationError = error instanceof Error ? error.message : "Saved connection data needs recovery."; }
  return { repository, migrationError };
}

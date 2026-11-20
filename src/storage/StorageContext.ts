import { createContext, useContext } from "react";
import type { Repositories } from "./repositories";

export const StorageContext = createContext<Repositories | null>(null);

export function useRepositories(): Repositories {
  const repos = useContext(StorageContext);
  if (!repos) throw new Error("useRepositories must be used inside <StorageContext>");
  return repos;
}

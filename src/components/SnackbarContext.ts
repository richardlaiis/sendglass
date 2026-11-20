import { createContext, useContext } from "react";

export interface SnackbarApi {
  show: (message: string) => void;
}

export const SnackbarContext = createContext<SnackbarApi | null>(null);

export function useSnackbar(): SnackbarApi {
  const api = useContext(SnackbarContext);
  if (!api) throw new Error("useSnackbar must be used inside <SnackbarProvider>");
  return api;
}

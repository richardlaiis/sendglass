import { createContext, useContext } from "react";

export interface SnackbarOptions {
  /** One text button next to the message. Tapping it also closes the snackbar. */
  action?: { label: string; onClick: () => void };
  /** Stays until the action or the dismiss button is tapped, instead of timing out. */
  persistent?: boolean;
}

export interface SnackbarApi {
  show: (message: string, options?: SnackbarOptions) => void;
}

export const SnackbarContext = createContext<SnackbarApi | null>(null);

export function useSnackbar(): SnackbarApi {
  const api = useContext(SnackbarContext);
  if (!api) throw new Error("useSnackbar must be used inside <SnackbarProvider>");
  return api;
}

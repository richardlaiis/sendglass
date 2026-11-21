import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../components/SnackbarContext";
import { applyUpdate, onUpdateReady } from "../notifications/serviceWorker";

/** SPEC §11: "Update available, reload?" when a new version has been deployed. */
export function useUpdatePrompt(): void {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  // Read t through a ref so a language switch doesn't re-subscribe and re-show a dismissed prompt.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(
    () =>
      onUpdateReady(() =>
        snackbar.show(tRef.current("update.available"), {
          persistent: true,
          action: { label: tRef.current("update.reload"), onClick: applyUpdate },
        }),
      ),
    [snackbar],
  );
}

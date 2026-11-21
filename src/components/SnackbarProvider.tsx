import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SnackbarContext, type SnackbarOptions } from "./SnackbarContext";

const DURATION_MS = 4000;

interface Message extends SnackbarOptions {
  text: string;
  key: number;
}

/** One snackbar at a time; a new message replaces the current one. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<Message | null>(null);

  const show = useCallback((text: string, options: SnackbarOptions = {}) => {
    setMessage((prev) => ({ ...options, text, key: (prev?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!message || message.persistent) return;
    const timer = setTimeout(() => setMessage(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext value={api}>
      {children}
      <div className="snackbar-region" role="status" aria-live="polite">
        {message && (
          <div key={message.key} className="snackbar">
            <span className="snackbar__text">{message.text}</span>
            {(message.action || message.persistent) && (
              <span className="snackbar__actions">
                {message.persistent && (
                  <button
                    type="button"
                    className="btn btn--text snackbar__action"
                    onClick={() => setMessage(null)}
                  >
                    {t("snackbar.dismiss")}
                  </button>
                )}
                {message.action && (
                  <button
                    type="button"
                    className="btn btn--text snackbar__action"
                    onClick={() => {
                      setMessage(null);
                      message.action?.onClick();
                    }}
                  >
                    {message.action.label}
                  </button>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </SnackbarContext>
  );
}

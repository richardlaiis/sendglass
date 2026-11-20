import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SnackbarContext } from "./SnackbarContext";

const DURATION_MS = 4000;

/** One snackbar at a time; a new message replaces the current one. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; key: number } | null>(null);

  const show = useCallback((text: string) => {
    setMessage((prev) => ({ text, key: (prev?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!message) return;
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
            {message.text}
          </div>
        )}
      </div>
    </SnackbarContext>
  );
}

import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  /** Esc, tapping the scrim, or the dismiss action. */
  onCancel: () => void;
  /** Buttons, in visual order. Mark the one to focus with `data-autofocus`. */
  actions: ReactNode;
  /** Change this to move focus back to `[data-autofocus]` while the dialog stays open. */
  focusKey?: string | number;
}

/** M3 basic dialog on top of the native modal <dialog> (focus trap, Esc, inert background). */
export function Dialog({ open, title, children, onCancel, actions, focusKey }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // showModal() focuses the first focusable element; we want the safe/primary one instead.
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [open, focusKey]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // Keep React in control of `open`.
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel(); // Click on the scrim.
      }}
    >
      <div className="dialog__surface">
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {children && <div className="dialog__body">{children}</div>}
        <div className="dialog__actions">{actions}</div>
      </div>
    </dialog>
  );
}

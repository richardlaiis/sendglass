import { useId } from "react";

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** M3 switch as a full-width row; the whole row is the touch target. */
export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="switch-row"
      onClick={() => onChange(!checked)}
    >
      <span className="switch-row__text">
        <span id={`${id}-label`} className="switch-row__label">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="switch-row__desc">
            {description}
          </span>
        )}
      </span>
      <span className="switch" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
    </button>
  );
}

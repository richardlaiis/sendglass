interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  /** The selected chip, or null if none matches. */
  value: T | null;
  onSelect: (value: T) => void;
}

/** M3 filter chips; single-select via aria-pressed. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: ChipGroupProps<T>) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="chip"
          aria-pressed={o.value === value}
          onClick={() => onSelect(o.value)}
        >
          {o.value === value && (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

'use client';

export interface FilterChipOption {
  // '' is the "All" / "Any" option.
  value: string;
  label: string;
  // Optional status dot, e.g. 'bg-status-alive'.
  dotClassName?: string;
}

interface FilterChipGroupProps {
  legend: string;
  name: string;
  options: FilterChipOption[];
  value: string;
  onSelect: (value: string) => void;
}

// A single-choice chip row built on native radios, so arrow keys and screen readers just work.
export function FilterChipGroup({ legend, name, options, value, onSelect }: FilterChipGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          // "All" uses the solid primary fill; a specific choice uses the cyan outline.
          const state = checked
            ? option.value === ''
              ? 'border-primary-container bg-primary-container font-semibold text-on-primary-container'
              : 'border-secondary bg-surface-container font-semibold text-on-surface'
            : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-on-surface';
          return (
            <label
              key={option.value || '__all'}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors has-focus-visible:ring-3 has-focus-visible:ring-primary/20 ${state}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              {option.dotClassName ? (
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${option.dotClassName}`}
                />
              ) : null}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

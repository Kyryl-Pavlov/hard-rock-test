'use client';

import { useId } from 'react';
import type { CharacterFilters } from '@rme/shared';
import {
  GENDER_OPTIONS,
  SPECIES_OPTIONS,
  STATUS_OPTIONS,
  normalizeFilters,
} from '@/lib/character-filters';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { FilterChipGroup, type FilterChipOption } from './filter-chip-group';

const STATUS_CHIPS: FilterChipOption[] = [
  { value: '', label: 'All' },
  { value: 'Alive', label: 'Alive', dotClassName: 'bg-status-alive' },
  { value: 'Dead', label: 'Dead', dotClassName: 'bg-status-dead' },
  { value: 'unknown', label: 'Unknown', dotClassName: 'bg-status-unknown' },
];

const SPECIES_CHIPS: FilterChipOption[] = [
  { value: '', label: 'Any' },
  ...SPECIES_OPTIONS.map((species) => ({
    value: species,
    label: species === 'unknown' ? 'Unknown' : species,
  })),
];

const FIELD_CLASS =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10';

const LABEL_CLASS = 'text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase';

interface FilterControlsProps {
  filters: CharacterFilters;
  // Receives only the changed fields; `undefined` clears a filter.
  onChange: (patch: CharacterFilters) => void;
  onReset: () => void;
}

// The filter form shared by the desktop side panel and the mobile drawer. The name search lives in
// the toolbar above the list so it stays visible on every screen size.
export function FilterControls({ filters, onChange, onReset }: FilterControlsProps) {
  const id = useId();
  const [type, setType] = useDebouncedText(filters.type ?? '', (value) =>
    onChange({ type: value }),
  );
  const hasFilters = Object.keys(normalizeFilters(filters)).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <FilterChipGroup
        legend="Status"
        name={`${id}-status`}
        options={STATUS_CHIPS}
        value={filters.status ?? ''}
        onSelect={(value) => onChange({ status: STATUS_OPTIONS.find((s) => s === value) })}
      />

      <FilterChipGroup
        legend="Species"
        name={`${id}-species`}
        options={SPECIES_CHIPS}
        value={filters.species ?? ''}
        onSelect={(value) => onChange({ species: value || undefined })}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-gender`} className={LABEL_CLASS}>
          Gender
        </label>
        <select
          id={`${id}-gender`}
          value={filters.gender ?? ''}
          onChange={(e) => onChange({ gender: GENDER_OPTIONS.find((g) => g === e.target.value) })}
          className={FIELD_CLASS}
        >
          <option value="" className="bg-surface-container-high">
            Any gender
          </option>
          {GENDER_OPTIONS.map((gender) => (
            <option key={gender} value={gender} className="bg-surface-container-high">
              {gender === 'unknown' ? 'Unknown' : gender}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-type`} className={LABEL_CLASS}>
          Type
        </label>
        <input
          id={`${id}-type`}
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setType(type, true);
          }}
          placeholder="e.g. Parasite, Clone"
          autoComplete="off"
          className={FIELD_CLASS}
        />
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!hasFilters}
        className="h-11 self-start rounded-lg border border-transparent px-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant md:h-10"
      >
        Reset filters
      </button>
    </div>
  );
}

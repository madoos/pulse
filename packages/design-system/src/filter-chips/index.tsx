import { ToggleButton, ToggleButtonGroup, type Key } from 'react-aria-components';
import styles from './filter-chips.module.scss';

export type FilterChip = { id: string; label: string; count?: number };

export type FilterChipsProps = {
  label: string;
  chips: FilterChip[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
};

/** A single choice among a few filters, always with one selected. */
export const FilterChips = ({ label, chips, selectedKey, onSelectionChange }: FilterChipsProps) => (
  <ToggleButtonGroup
    aria-label={label}
    className={styles['filter-chips']}
    selectionMode="single"
    disallowEmptySelection
    selectedKeys={[selectedKey]}
    onSelectionChange={(keys: Set<Key>) => {
      const [key] = [...keys];
      if (key !== undefined) onSelectionChange(String(key));
    }}
  >
    {chips.map((chip) => (
      <ToggleButton key={chip.id} id={chip.id} className={styles['filter-chips__chip']}>
        {chip.label}
        {chip.count !== undefined && ' '}
        {chip.count !== undefined && (
          <span className={styles['filter-chips__count']}>{chip.count}</span>
        )}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

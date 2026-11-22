import styles from './period-filters.module.scss';

export type FilterKey = 'period' | 'compare' | 'group';

const NAMES: Record<FilterKey, string> = {
  period: 'periodo',
  compare: 'comparar con',
  group: 'agrupar por',
};

/** Which filters change a section, so it is clear what each filter does. */
export const FilterScope = ({ uses }: { uses: FilterKey[] }) => (
  <span className={styles['filter-scope']}>
    <span className={styles['filter-scope__label']}>Usa:</span>
    {uses.map((key) => (
      <span key={key} className={styles['filter-scope__filter']}>
        {NAMES[key]}
      </span>
    ))}
  </span>
);

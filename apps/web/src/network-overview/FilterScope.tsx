import styles from './network-overview.module.scss';

export type FilterKey = 'period' | 'compare' | 'group';

const NAMES: Record<FilterKey, string> = {
  period: 'periodo',
  compare: 'comparar con',
  group: 'agrupar por',
};

/** Which filters change a section, so it is clear what each filter does. */
export const FilterScope = ({ uses }: { uses: FilterKey[] }) => (
  <span className={styles['network-overview__scope']}>
    <span className={styles['network-overview__scope-label']}>Usa:</span>
    {uses.map((key) => (
      <span key={key} className={styles['network-overview__scope-filter']}>
        {NAMES[key]}
      </span>
    ))}
  </span>
);

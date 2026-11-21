import styles from './chart-legend.module.scss';

export type ChartLegendItem = {
  id: string;
  label: string;
  /** Series colour, from 1 to 6, the same as in the charts. */
  color?: 1 | 2 | 3 | 4 | 5 | 6;
  /** A muted series is drawn dashed, for example a compared year. */
  muted?: boolean;
};

export type ChartLegendProps = { items: ChartLegendItem[] };

/** What each line of a chart is. One legend can serve several charts that share their series. */
export const ChartLegend = ({ items }: ChartLegendProps) => (
  <ul className={styles['chart-legend']} aria-label="Leyenda">
    {items.map((item) => {
      const colorClass = styles[`chart-legend--color-${item.color ?? 1}`];
      const mutedClass = item.muted ? styles['chart-legend__swatch--muted'] : '';
      return (
        <li key={item.id} className={`${styles['chart-legend__item']} ${colorClass}`}>
          <span className={`${styles['chart-legend__swatch']} ${mutedClass}`} aria-hidden="true" />
          {item.label}
        </li>
      );
    })}
  </ul>
);

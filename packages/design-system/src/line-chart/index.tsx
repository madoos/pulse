import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useState, type PointerEvent } from 'react';
import { ChartLegend } from '../chart-legend';
import styles from './line-chart.module.scss';
import { useWidth } from './useWidth';

export type LineChartSeries = {
  id: string;
  label: string;
  /** One value per category; null leaves a gap, never a zero. */
  values: (number | null)[];
  /** Series colour, from 1 to 6. Give the same series the same colour across a view. */
  color?: 1 | 2 | 3 | 4 | 5 | 6;
  /** A muted series stays behind the main ones, for example a compared year. */
  muted?: boolean;
};

export type LineChartProps = {
  /** What the chart shows, for screen readers. */
  label: string;
  /** The labels of the horizontal axis, for example the months. */
  categories: string[];
  series: LineChartSeries[];
  formatValue: (value: number) => string;
  /** Shorter labels for the vertical axis. Uses `formatValue` if not given. */
  formatTick?: (value: number) => string;
  /** An extra line for the tooltip of a category, for example how many items have data. */
  describeCategory?: (index: number) => string | undefined;
  /** A small chart for a card: shorter, fewer labels and no legend of its own. */
  compact?: boolean;
  height?: number;
};

const MARGIN = { top: 12, right: 16, bottom: 28, left: 56 };
const COMPACT_MARGIN = { top: 8, right: 8, bottom: 22, left: 48 };
const COMPACT_LABELS = 4;

const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

const colorOf = (series: LineChartSeries) => styles[`line-chart--color-${series.color ?? 1}`];

export const LineChart = ({
  label,
  categories,
  series,
  formatValue,
  formatTick = formatValue,
  describeCategory,
  compact = false,
  height = compact ? 130 : 220,
}: LineChartProps) => {
  const margin = compact ? COMPACT_MARGIN : MARGIN;
  const yTicks = compact ? 3 : 4;
  // A compact chart labels a few categories only, so they never overlap.
  const every = compact ? Math.ceil(categories.length / COMPACT_LABELS) : 1;
  const xTicks = categories.filter((_, i) => i % every === 0 || i === categories.length - 1);
  const [containerRef, width] = useWidth<HTMLDivElement>(600);
  const [active, setActive] = useState<number | null>(null);

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = height - margin.top - margin.bottom;
  const values = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const x = scalePoint({ domain: categories.map(String), range: [0, innerWidth] });
  const y = scaleLinear({
    domain: values.length ? [Math.min(...values), Math.max(...values)] : [0, 1],
    range: [innerHeight, 0],
    nice: true,
  });
  const xOf = (index: number) => x(categories[index] ?? '') ?? 0;

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const point = localPoint(event);
    if (!point || categories.length === 0) return;
    const step = categories.length > 1 ? innerWidth / (categories.length - 1) : innerWidth;
    const index = Math.round((point.x - margin.left) / (step || 1));
    setActive(Math.min(Math.max(index, 0), categories.length - 1));
  };

  const ordered = [...series].sort((a, b) => Number(b.muted ?? false) - Number(a.muted ?? false));
  const detail = active === null ? undefined : describeCategory?.(active);

  return (
    <figure className={styles['line-chart']}>
      {!compact && series.length > 1 && (
        <ChartLegend
          items={series.map(({ id, label, color, muted }) => ({ id, label, color, muted }))}
        />
      )}
      <div ref={containerRef} className={styles['line-chart__plot']}>
        <svg width={width} height={height} role="img" aria-label={label}>
          <Group left={margin.left} top={margin.top}>
            <GridRows
              scale={y}
              width={innerWidth}
              numTicks={yTicks}
              className={styles['line-chart__grid']}
            />
            <AxisLeft
              scale={y}
              numTicks={yTicks}
              hideAxisLine
              hideTicks
              tickFormat={(value) => formatTick(Number(value))}
              axisClassName={styles['line-chart__axis']}
              tickLabelProps={{ className: styles['line-chart__tick'], textAnchor: 'end', dx: -4 }}
            />
            <AxisBottom
              top={innerHeight}
              scale={x}
              tickValues={xTicks}
              hideTicks
              axisLineClassName={styles['line-chart__baseline']}
              axisClassName={styles['line-chart__axis']}
              tickLabelProps={{ className: styles['line-chart__tick'], textAnchor: 'middle' }}
            />
            {active !== null && (
              <line
                x1={xOf(active)}
                x2={xOf(active)}
                y1={0}
                y2={innerHeight}
                className={styles['line-chart__cursor']}
              />
            )}
            {ordered.map((s) => (
              <LinePath
                key={s.id}
                // Names the line for end-to-end tests, which cannot see it in the accessibility tree.
                data-series={s.label}
                data={s.values.map((value, index) => ({ value, index }))}
                x={(d) => xOf(d.index)}
                y={(d) => y(d.value ?? 0)}
                defined={(d) => d.value !== null}
                className={classes(
                  styles['line-chart__line'],
                  colorOf(s),
                  s.muted && styles['line-chart__line--muted'],
                )}
              />
            ))}
            {active !== null &&
              ordered.map((s) => {
                const value = s.values[active];
                if (value === null || value === undefined) return null;
                return (
                  <circle
                    key={s.id}
                    cx={xOf(active)}
                    cy={y(value)}
                    r={4}
                    className={classes(styles['line-chart__dot'], colorOf(s))}
                  />
                );
              })}
          </Group>
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            data-testid="line-chart-overlay"
          />
        </svg>
        {active !== null && (
          <div
            className={styles['line-chart__tooltip']}
            style={{
              left: Math.min(margin.left + xOf(active), width - 8),
              transform: xOf(active) > innerWidth / 2 ? 'translateX(-100%)' : undefined,
            }}
            role="tooltip"
          >
            <p className={styles['line-chart__tooltip-title']}>{categories[active]}</p>
            {series.map((s) => {
              const value = s.values[active];
              return (
                <p key={s.id} className={styles['line-chart__tooltip-row']}>
                  {series.length > 1 && <span>{s.label}: </span>}
                  <strong>
                    {value === null || value === undefined ? '—' : formatValue(value)}
                  </strong>
                </p>
              );
            })}
            {detail && <p className={styles['line-chart__tooltip-detail']}>{detail}</p>}
          </div>
        )}
      </div>
    </figure>
  );
};

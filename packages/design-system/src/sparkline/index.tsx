import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import styles from './sparkline.module.scss';

export type SparklineProps = {
  /** One value per point; null leaves a gap. */
  values: (number | null)[];
  /** What the line shows, for screen readers. */
  label: string;
};

const WIDTH = 100;
const HEIGHT = 32;
const PADDING = 3;

export const Sparkline = ({ values, label }: SparklineProps) => {
  const defined = values.filter((v): v is number => v !== null);
  const x = scaleLinear({ domain: [0, Math.max(values.length - 1, 1)], range: [0, WIDTH] });
  const y = scaleLinear({
    domain: [Math.min(...defined), Math.max(...defined)],
    range: [HEIGHT - PADDING, PADDING],
  });
  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <LinePath
        data={values.map((value, index) => ({ value, index }))}
        x={(d) => x(d.index)}
        y={(d) => y(d.value ?? 0)}
        defined={(d) => d.value !== null}
        className={styles.sparkline__line}
      />
    </svg>
  );
};

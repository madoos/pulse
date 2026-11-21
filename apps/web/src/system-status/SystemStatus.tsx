import { Button } from '@pulse/design-system';
import styles from './system-status.module.scss';
import type { SystemStatusValue } from './systemStatus.slice';

const labels: Record<SystemStatusValue, string> = {
  checking: 'Comprobando la API…',
  up: 'API operativa',
  down: 'API no disponible',
};

export type SystemStatusProps = {
  status: SystemStatusValue;
  onRetry: () => void;
};

export const SystemStatus = ({ status, onRetry }: SystemStatusProps) => (
  <section className={styles['system-status']} aria-label="Estado del sistema">
    <span
      className={`${styles['system-status__indicator']} ${styles[`system-status__indicator--${status}`] ?? ''}`}
      aria-hidden="true"
    />
    <p className={styles['system-status__label']} role="status">
      {labels[status]}
    </p>
    {status === 'down' && (
      <Button variant="secondary" onPress={onRetry}>
        Reintentar
      </Button>
    )}
  </section>
);

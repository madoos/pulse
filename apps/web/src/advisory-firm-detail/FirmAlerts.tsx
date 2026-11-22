import type { Alert } from '@pulse/contracts';
import { Badge } from '@pulse/design-system';
import { ALERT_LABELS, ALERT_RULES, describeAlert } from '@shared/metrics/alerts';
import { formatFiscalYear } from '@shared/format';
import styles from './advisory-firm-detail.module.scss';

export type FirmAlertsProps = {
  alerts: Alert[];
  /** The year the alerts compare with, null when there is no previous year. */
  comparedWith: number | null;
};

/** What goes wrong in the firm, in red, by the same rules as in the network overview. */
export const FirmAlerts = ({ alerts, comparedWith }: FirmAlertsProps) => {
  const against =
    comparedWith === null
      ? 'Sin año anterior con datos: solo se comprueban las bajas y los datos que faltan.'
      : `Frente a los mismos meses de ${formatFiscalYear(comparedWith)}.`;
  return (
    <div className={styles['advisory-firm-detail__alerts']}>
      {alerts.length === 0 ? (
        <p className={styles['advisory-firm-detail__alert']}>
          <Badge tone="success">Sin alertas</Badge>
          <span>No hay nada que vaya mal en el periodo. {against}</span>
        </p>
      ) : (
        <>
          <ul className={styles['advisory-firm-detail__alert-list']} aria-label="Alertas">
            {alerts.map((alert) => {
              const { value, context } = describeAlert(alert);
              return (
                <li key={alert.type} className={styles['advisory-firm-detail__alert']}>
                  <Badge tone="danger">{ALERT_LABELS[alert.type]}</Badge>
                  {value && (
                    <span className={styles['advisory-firm-detail__alert-value']}>{value}</span>
                  )}
                  <span className={styles['advisory-firm-detail__alert-context']}>{context}</span>
                </li>
              );
            })}
          </ul>
          <p className={styles['advisory-firm-detail__alert-context']}>{against}</p>
        </>
      )}
      <details className={styles['advisory-firm-detail__rules']}>
        <summary>Cómo se detecta</summary>
        <ul>
          {ALERT_RULES.map(({ type, rule }) => (
            <li key={type}>
              <strong>{ALERT_LABELS[type]}:</strong> {rule}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};

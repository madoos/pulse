import { ALERT_TYPES, type FirmNeedingAttention } from '@pulse/contracts';
import { Badge, FilterChips, Message, Panel, Table } from '@pulse/design-system';
import { formatFiscalYear } from '@shared/format';
import { ALERT_LABELS, ALERT_RULES, describeAlert } from './alerts';
import { FirmLink } from './FirmLink';
import styles from './highlights.module.scss';
import type { AlertFilter } from './networkHighlights.slice';

export type NeedsAttentionProps = {
  firms: FirmNeedingAttention[];
  previousFiscalYear: number | null;
  alertFilter: AlertFilter;
  onAlertFilterChange: (filter: AlertFilter) => void;
};

const columns = [
  { id: 'firm', label: 'Asesoría', isRowHeader: true },
  { id: 'alerts', label: 'Alertas' },
  { id: 'count', label: 'Nº', align: 'end' as const },
];

export const NeedsAttention = ({
  firms,
  previousFiscalYear,
  alertFilter,
  onAlertFilterChange,
}: NeedsAttentionProps) => {
  const withAlert = (type: AlertFilter) =>
    type === 'all' ? firms : firms.filter((f) => f.alerts.some((a) => a.type === type));
  const chips = [
    { id: 'all', label: 'Todas', count: firms.length },
    ...ALERT_TYPES.map((type) => ({
      id: type,
      label: ALERT_LABELS[type],
      count: withAlert(type).length,
    })),
  ];
  const shown = withAlert(alertFilter);

  return (
    <Panel
      title="Necesitan atención"
      tone={firms.length > 0 ? 'danger' : 'default'}
      description={
        previousFiscalYear === null
          ? 'No hay año anterior: solo se comprueban las bajas y los datos que faltan.'
          : `Frente a los mismos meses de ${formatFiscalYear(previousFiscalYear)}.`
      }
      aside={`${firms.length} ${firms.length === 1 ? 'asesoría' : 'asesorías'}`}
    >
      {firms.length === 0 ? (
        <Message title="Ninguna asesoría necesita atención en este periodo" />
      ) : (
        <>
          <FilterChips
            label="Filtrar por tipo de alerta"
            chips={chips}
            selectedKey={alertFilter}
            onSelectionChange={(key) => onAlertFilterChange(key as AlertFilter)}
          />
          <Table
            label="Asesorías que necesitan atención"
            columns={columns}
            rows={shown.map(({ firm, alerts }) => ({
              id: String(firm.id),
              cells: {
                firm: <FirmLink firm={firm} />,
                alerts: (
                  <ul className={styles.highlights__alerts}>
                    {alerts.map((alert) => {
                      const { value, context } = describeAlert(alert);
                      return (
                        <li key={alert.type} className={styles.highlights__alert}>
                          <Badge tone="danger">{ALERT_LABELS[alert.type]}</Badge>
                          {value && <span className={styles.highlights__value}>{value}</span>}
                          <span className={styles.highlights__context}>{context}</span>
                        </li>
                      );
                    })}
                  </ul>
                ),
                count: alerts.length,
              },
            }))}
          />
        </>
      )}
      <details className={styles.highlights__rules}>
        <summary>Cómo se detecta</summary>
        <ul>
          {ALERT_RULES.map(({ type, rule }) => (
            <li key={type}>
              <strong>{ALERT_LABELS[type]}:</strong> {rule}
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
};

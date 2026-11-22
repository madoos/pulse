import { ALERT_TYPES, type FirmNeedingAttention } from '@pulse/contracts';
import { Badge, Button, FilterChips, Message, Panel } from '@pulse/design-system';
import { FilterScope } from '@shared/period-filters/FilterScope';
import { formatFiscalYear } from '@shared/format';
import { useState } from 'react';
import { ALERT_LABELS, ALERT_RULES, describeAlert } from '@shared/metrics/alerts';
import { FirmCard, FirmCards } from './FirmCard';
import styles from './highlights.module.scss';
import type { AlertFilter } from './networkHighlights.slice';

export type NeedsAttentionProps = {
  firms: FirmNeedingAttention[];
  previousFiscalYear: number | null;
  alertFilter: AlertFilter;
  onAlertFilterChange: (filter: AlertFilter) => void;
};

/** How many squares are shown before "Ver todas". */
export const SHOWN = 4;

export const NeedsAttention = ({
  firms,
  previousFiscalYear,
  alertFilter,
  onAlertFilterChange,
}: NeedsAttentionProps) => {
  const [showAll, setShowAll] = useState(false);
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
  const filtered = withAlert(alertFilter);
  const shown = showAll ? filtered : filtered.slice(0, SHOWN);

  return (
    <Panel
      title="Necesitan atención"
      tone={firms.length > 0 ? 'danger' : 'default'}
      description={
        previousFiscalYear === null
          ? 'No hay año anterior: solo se comprueban las bajas y los datos que faltan.'
          : `Frente a los mismos meses de ${formatFiscalYear(previousFiscalYear)}, el año anterior, aunque compares con otro.`
      }
      aside={<FilterScope uses={['period']} />}
      collapsible
      summary={
        firms.length === 0 ? (
          <Badge tone="success">Ninguna asesoría necesita atención</Badge>
        ) : (
          <span className={styles['highlights__summary']}>
            {chips
              .slice(1)
              .flatMap(({ id, label, count }) =>
                count > 0 ? [<Badge key={id} tone="danger">{`${label} ${count}`}</Badge>] : [],
              )}
          </span>
        )
      }
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
          <FirmCards label="Asesorías que necesitan atención">
            {shown.map(({ firm, alerts }) => (
              <FirmCard key={firm.id} firm={firm}>
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
              </FirmCard>
            ))}
          </FirmCards>
          {filtered.length > SHOWN && (
            <div>
              <Button variant="secondary" onPress={() => setShowAll(!showAll)}>
                {showAll ? 'Ver menos' : `Ver todas (${filtered.length})`}
              </Button>
            </div>
          )}
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

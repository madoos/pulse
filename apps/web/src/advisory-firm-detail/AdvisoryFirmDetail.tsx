import type { AdvisoryFirm, FirmPerformance } from '@pulse/contracts';
import { Button, Message, PageHeader, Panel } from '@pulse/design-system';
import { FilterScope } from '@shared/period-filters/FilterScope';
import type { MetricKey } from '@shared/metrics/metrics';
import { PeriodFilters, describePeriod } from '@shared/period-filters/PeriodFilters';
import type { PeriodFilters as Filters } from '@shared/period-filters/period.filters';
import { yearLegend, yearSeries } from '@shared/metric-cards/charts';
import { MetricCards } from '@shared/metric-cards/MetricCards';
import { SectionState } from '@shared/section-state/SectionState';
import { formatFiscalYear } from '@shared/format';
import { Link } from 'react-router';
import type { LoadStatus, ProfileStatus } from './advisoryFirmDetail.slice';
import { AgainstSpecialty } from './AgainstSpecialty';
import { AlertsSummary, FirmAlerts } from './FirmAlerts';
import { FirmProfile } from './FirmProfile';
import { SixMonthsAgo } from './SixMonthsAgo';
import styles from './advisory-firm-detail.module.scss';

/** The metrics of the network, measured for the firm, and its tax filings. */
export const FIRM_METRICS: MetricKey[] = [
  'activeClients',
  'revenue',
  'revenuePerClient',
  'churnRate',
  'revenuePerEmployee',
  'taxFilings',
  'incidentRate',
];

const FOOTNOTES: Partial<Record<MetricKey, string>> = {
  activeClients: 'Clientes del último mes del periodo.',
  revenue: 'Facturación de la asesoría en el periodo.',
  revenuePerEmployee:
    'Facturación del periodo entre los empleados de hoy: no hay histórico de plantilla.',
};

export type AdvisoryFirmDetailProps = {
  /** Where "Volver" goes. */
  backTo: string;
  profile: { status: ProfileStatus; data: AdvisoryFirm | null };
  fiscalYears: number[];
  filters: Filters | null;
  calendarMonths: number[];
  performance: { status: LoadStatus; data: FirmPerformance | null };
  onFiltersChange: (change: Partial<Filters>) => void;
  onRetryProfile: () => void;
  onRetryPerformance: () => void;
};

const Performance = ({
  data,
  calendarMonths,
}: {
  data: FirmPerformance;
  calendarMonths: number[];
}) => (
  <MetricCards
    performance={data}
    metrics={FIRM_METRICS}
    footnotes={FOOTNOTES}
    calendarMonths={calendarMonths}
    charts={FIRM_METRICS.map((metric) => ({
      metric,
      series: yearSeries(data, calendarMonths, metric),
    }))}
    legend={yearLegend(data)}
    linesAre="una línea por año"
  />
);

/** An advisory firm measured as the network is, with the same filters. */
export const AdvisoryFirmDetail = ({
  backTo,
  profile,
  fiscalYears,
  filters,
  calendarMonths,
  performance,
  onFiltersChange,
  onRetryProfile,
  onRetryPerformance,
}: AdvisoryFirmDetailProps) => {
  const back = (
    <Link to={backTo} className={styles['advisory-firm-detail__back']}>
      ← Volver
    </Link>
  );
  if (profile.status === 'not-found') {
    return (
      <div className={styles['advisory-firm-detail']}>
        <PageHeader title="Asesoría no encontrada" back={back} />
        <Message title="No existe ninguna asesoría con ese identificador" />
      </div>
    );
  }
  const firm = profile.data;
  return (
    <div className={styles['advisory-firm-detail']}>
      <PageHeader
        title={firm?.name ?? 'Asesoría'}
        description={firm && `${firm.specialty} · ${firm.city}, ${firm.province}`}
        back={back}
      />
      {profile.status === 'failed' && (
        <Message
          tone="error"
          title="No se han podido cargar los datos de la asesoría"
          action={
            <Button variant="secondary" onPress={onRetryProfile}>
              Reintentar
            </Button>
          }
        />
      )}
      {firm && (
        <Panel title="Datos de la asesoría">
          <FirmProfile firm={firm} />
        </Panel>
      )}
      {filters && (
        <>
          <Panel
            title="Filtros"
            description={<span aria-live="polite">{describePeriod(filters)}</span>}
            collapsible
          >
            <PeriodFilters fiscalYears={fiscalYears} filters={filters} onChange={onFiltersChange} />
          </Panel>
          <Panel
            title="Alertas"
            description="Lo que va mal en el periodo, con las mismas reglas que en la red"
            aside={<FilterScope uses={['period']} />}
            collapsible
            summary={performance.data && <AlertsSummary alerts={performance.data.alerts} />}
          >
            <SectionState
              status={performance.status}
              what="las alertas de la asesoría"
              onRetry={onRetryPerformance}
            >
              {performance.data && (
                <FirmAlerts
                  alerts={performance.data.alerts}
                  comparedWith={performance.data.alertsComparedWith}
                />
              )}
            </SectionState>
          </Panel>
          <Panel
            title="Indicadores"
            description={`La asesoría en ${formatFiscalYear(filters.fiscalYear)}, mes a mes`}
            aside={<FilterScope uses={['period', 'compare']} />}
          >
            <SectionState
              status={performance.status}
              what="las métricas de la asesoría"
              onRetry={onRetryPerformance}
            >
              {performance.data && (
                <Performance data={performance.data} calendarMonths={calendarMonths} />
              )}
            </SectionState>
          </Panel>
          <Panel
            title="Frente a su especialidad"
            description={`La asesoría frente a la media del resto de asesorías de ${firm?.specialty ?? 'su especialidad'} en ${formatFiscalYear(filters.fiscalYear)}: comparten estacionalidad, así que la distancia entre las líneas es mérito o problema de la asesoría`}
            aside={<FilterScope uses={['period']} />}
          >
            <SectionState
              status={performance.status}
              what="la comparación con su especialidad"
              onRetry={onRetryPerformance}
            >
              {performance.data && (
                <AgainstSpecialty
                  performance={performance.data}
                  specialty={firm?.specialty ?? 'su especialidad'}
                  metrics={FIRM_METRICS}
                  footnotes={FOOTNOTES}
                  calendarMonths={calendarMonths}
                />
              )}
            </SectionState>
          </Panel>
          <Panel
            title="Hace seis meses"
            description="El último mes del periodo frente a seis meses antes, y lo mismo en su especialidad: la diferencia quita la estacionalidad"
            aside={<FilterScope uses={['period']} />}
          >
            <SectionState
              status={performance.status}
              what="las métricas de la asesoría"
              onRetry={onRetryPerformance}
            >
              {performance.data && (
                <SixMonthsAgo comparison={performance.data.sixMonthsAgo} metrics={FIRM_METRICS} />
              )}
            </SectionState>
          </Panel>
        </>
      )}
    </div>
  );
};

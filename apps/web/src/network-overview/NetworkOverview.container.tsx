import { useAppDispatch, useAppSelector } from '@app/store';
import { useFirmsDrawer } from '@advisory-firms/firmsDrawer.url';
import { PageHeader, Panel, SearchField } from '@pulse/design-system';
import { formatFiscalYear } from '@shared/format';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { GroupTableContainer } from './groups/GroupTable.container';
import { NeedsAttentionContainer, StandoutsContainer } from './highlights/Highlights.container';
import styles from './network-overview.module.scss';
import { NetworkFilters, describeFilters } from './NetworkFilters';
import {
  changeFilters,
  monthsOfPeriod,
  resolveFilters,
  toSearchParams,
  type NetworkFilters as Filters,
} from './networkOverview.filters';
import { fiscalYearsRequested, networkFiltersChanged } from './networkOverview.slice';
import { NetworkChartsContainer } from './performance/NetworkCharts.container';
import { NetworkKpisContainer } from './performance/NetworkKpis.container';
import { SectionState } from './SectionState';

/** The network overview. The filters live in the URL; every section loads from them. */
export const NetworkOverviewContainer = () => {
  const { status, fiscalYears } = useAppSelector((state) => state.networkOverview);
  const dispatch = useAppDispatch();
  const [params, setParams] = useSearchParams();
  const firmsDrawer = useFirmsDrawer();

  useEffect(() => {
    if (status === 'idle') dispatch(fiscalYearsRequested());
  }, [status, dispatch]);

  const filters = useMemo(
    () => (fiscalYears.length > 0 ? resolveFilters(params, fiscalYears) : null),
    [params, fiscalYears],
  );
  // Equal filters may be dispatched again, for example on a new search string with the same
  // values: each section only reloads when its own query changes.
  useEffect(() => {
    if (filters) dispatch(networkFiltersChanged(filters));
  }, [filters, dispatch]);

  const onChange = (change: Partial<Filters>) => {
    if (filters) setParams(toSearchParams(changeFilters(filters, change)));
  };

  return (
    <div className={styles['network-overview']}>
      <PageHeader
        title="Vista de red"
        description="Cómo evoluciona la red de asesorías y cuáles necesitan atención"
        actions={
          <SearchField
            label="Buscar asesoría"
            hideLabel
            placeholder="Buscar asesoría por nombre, ciudad o CIF"
            onSubmit={(search) => firmsDrawer.open({ search })}
          />
        }
      />
      <SectionState
        status={fiscalYears.length === 0 && status === 'loaded' ? 'loading' : status}
        what="los años con datos"
        onRetry={() => dispatch(fiscalYearsRequested())}
      >
        {filters && (
          <>
            <Panel
              title="Filtros"
              description={<span aria-live="polite">{describeFilters(filters)}</span>}
            >
              <NetworkFilters fiscalYears={fiscalYears} filters={filters} onChange={onChange} />
            </Panel>
            <Panel
              title="Indicadores"
              description={`La red en ${formatFiscalYear(filters.fiscalYear)}`}
            >
              <NetworkKpisContainer calendarMonths={monthsOfPeriod(filters)} />
            </Panel>
            <NeedsAttentionContainer />
            <Panel title="Evolución mensual" description="Cada indicador mes a mes">
              <NetworkChartsContainer filters={filters} calendarMonths={monthsOfPeriod(filters)} />
            </Panel>
            <GroupTableContainer filters={filters} />
            <StandoutsContainer />
          </>
        )}
      </SectionState>
    </div>
  );
};

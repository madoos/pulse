import { useAppDispatch, useAppSelector } from '@app/store';
import { useFirmsDrawer } from '@advisory-firms/firmsDrawer.url';
import { PageHeader, Panel, SearchField } from '@pulse/design-system';
import { formatFiscalYear } from '@shared/format';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { GroupTableContainer } from './groups/GroupTable.container';
import { NeedsAttentionContainer, StandoutsContainer } from './highlights/Highlights.container';
import styles from './network-overview.module.scss';
import { fiscalYearsRequested } from '@shared/fiscal-years/fiscalYears.slice';
import { FilterScope } from '@shared/period-filters/FilterScope';
import { PeriodFilters } from '@shared/period-filters/PeriodFilters';
import { monthsOfPeriod } from '@shared/period-filters/period.filters';
import { SectionState } from '@shared/section-state/SectionState';
import { GroupBySelect } from './GroupBySelect';
import {
  changeFilters,
  describeFilters,
  resolveFilters,
  toSearchParams,
  type NetworkFilters as Filters,
} from './networkOverview.filters';
import { networkFiltersChanged } from './networkOverview.slice';
import { IndicatorsContainer } from './performance/Indicators.container';

/** The network overview. The filters live in the URL; every section loads from them. */
export const NetworkOverviewContainer = () => {
  const { status, years: fiscalYears } = useAppSelector((state) => state.fiscalYears);
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
        sticky
        actions={
          <SearchField
            label="Buscar asesoría"
            hideLabel
            placeholder="Nombre de la asesoría"
            submitLabel="Buscar"
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
              collapsible
            >
              <PeriodFilters fiscalYears={fiscalYears} filters={filters} onChange={onChange}>
                <GroupBySelect groupBy={filters.groupBy} onChange={onChange} />
              </PeriodFilters>
            </Panel>
            <GroupTableContainer filters={filters} />
            <Panel
              title="Indicadores"
              description={`La red en ${formatFiscalYear(filters.fiscalYear)}, mes a mes`}
              aside={<FilterScope uses={['period', 'compare', 'group']} />}
            >
              <IndicatorsContainer filters={filters} calendarMonths={monthsOfPeriod(filters)} />
            </Panel>
            <div className={styles['network-overview__highlights']}>
              <NeedsAttentionContainer />
              <StandoutsContainer />
            </div>
          </>
        )}
      </SectionState>
    </div>
  );
};

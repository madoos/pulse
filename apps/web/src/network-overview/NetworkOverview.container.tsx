import { useAppDispatch, useAppSelector } from '@app/store';
import { formatFiscalYear } from '@shared/format';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { GroupTableContainer } from './groups/GroupTable.container';
import { NeedsAttentionContainer, StandoutsContainer } from './highlights/Highlights.container';
import styles from './network-overview.module.scss';
import { NetworkFilters } from './NetworkFilters';
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
      <header className={styles['network-overview__header']}>
        <h1 className={styles['network-overview__title']}>Vista de red</h1>
      </header>
      <SectionState
        status={fiscalYears.length === 0 && status === 'loaded' ? 'loading' : status}
        what="los años con datos"
        onRetry={() => dispatch(fiscalYearsRequested())}
      >
        {filters && (
          <>
            <NetworkFilters fiscalYears={fiscalYears} filters={filters} onChange={onChange} />
            <section className={styles['network-overview__section']} aria-labelledby="kpis-title">
              <h2 id="kpis-title" className={styles['network-overview__section-title']}>
                La red · {formatFiscalYear(filters.fiscalYear)}
              </h2>
              <NetworkKpisContainer calendarMonths={monthsOfPeriod(filters)} />
            </section>
            <NeedsAttentionContainer />
            <section className={styles['network-overview__section']} aria-labelledby="charts-title">
              <h2 id="charts-title" className={styles['network-overview__section-title']}>
                Evolución mensual
              </h2>
              <NetworkChartsContainer filters={filters} calendarMonths={monthsOfPeriod(filters)} />
            </section>
            <GroupTableContainer filters={filters} />
            <StandoutsContainer />
          </>
        )}
      </SectionState>
    </div>
  );
};

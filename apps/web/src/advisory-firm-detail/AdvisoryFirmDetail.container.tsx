import { useAppDispatch, useAppSelector } from '@app/store';
import { fiscalYearsRequested } from '@shared/fiscal-years/fiscalYears.slice';
import {
  changePeriod,
  monthsOfPeriod,
  performanceQueryOf,
  periodSearchParams,
  resolvePeriod,
  type PeriodFilters,
} from '@shared/period-filters/period.filters';
import { backHref } from '@shared/navigation/firmLink';
import { useEffect, useMemo } from 'react';
import { SupportAssistantContainer } from '@support-assistant/SupportAssistant.container';
import { useLocation, useParams, useSearchParams } from 'react-router';
import { AdvisoryFirmDetail } from './AdvisoryFirmDetail';
import {
  firmFiltersChanged,
  firmPerformanceRequested,
  firmRequested,
} from './advisoryFirmDetail.slice';

/** The detail of a firm. Its filters live in the URL, as in the network overview. */
export const AdvisoryFirmDetailContainer = () => {
  const firmId = Number(useParams().id);
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const { status: yearsStatus, years: fiscalYears } = useAppSelector((s) => s.fiscalYears);
  const { profile, performance } = useAppSelector((s) => s.advisoryFirmDetail);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (yearsStatus === 'idle') dispatch(fiscalYearsRequested());
  }, [yearsStatus, dispatch]);

  useEffect(() => {
    dispatch(firmRequested(firmId));
  }, [firmId, dispatch]);

  const filters = useMemo(
    () => (fiscalYears.length > 0 ? resolvePeriod(params, fiscalYears) : null),
    [params, fiscalYears],
  );
  useEffect(() => {
    if (filters) dispatch(firmFiltersChanged({ firmId, query: performanceQueryOf(filters) }));
  }, [firmId, filters, dispatch]);

  const onFiltersChange = (change: Partial<PeriodFilters>) => {
    // Replacing the entry keeps "Volver" one step away, whatever the filters tried.
    if (filters)
      setParams(periodSearchParams(changePeriod(filters, change)), { replace: true, state });
  };

  const firm = profile.id === firmId && profile.status === 'loaded' ? profile.data : null;

  return (
    <>
      <AdvisoryFirmDetail
        backTo={backHref(state)}
        profile={profile.id === firmId ? profile : { status: 'loading', data: null }}
        fiscalYears={fiscalYears}
        filters={filters}
        calendarMonths={filters ? monthsOfPeriod(filters) : []}
        performance={
          performance.request?.firmId === firmId ? performance : { status: 'loading', data: null }
        }
        onFiltersChange={onFiltersChange}
        onRetryProfile={() => dispatch(firmRequested(firmId))}
        onRetryPerformance={() =>
          performance.request && dispatch(firmPerformanceRequested(performance.request))
        }
      />
      {firm && <SupportAssistantContainer firmId={firm.id} firmName={firm.name} />}
    </>
  );
};

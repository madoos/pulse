import { useAppDispatch, useAppSelector } from '@app/store';
import { SectionState } from '@network-overview/SectionState';
import { NetworkKpis } from './NetworkKpis';
import { performanceRequested } from './networkPerformance.slice';

export const NetworkKpisContainer = ({ calendarMonths }: { calendarMonths: number[] }) => {
  const { status, query, data } = useAppSelector((state) => state.networkPerformance);
  const dispatch = useAppDispatch();
  return (
    <SectionState
      status={status}
      what="las métricas de la red"
      onRetry={() => query && dispatch(performanceRequested(query))}
    >
      {data && <NetworkKpis performance={data} calendarMonths={calendarMonths} />}
    </SectionState>
  );
};

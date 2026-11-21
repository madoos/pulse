import { useAppDispatch, useAppSelector } from '@app/store';
import { SectionState } from '@network-overview/SectionState';
import { NeedsAttention } from './NeedsAttention';
import { alertFilterChanged, highlightsRequested } from './networkHighlights.slice';
import { Standouts } from './Standouts';

const useHighlights = () => {
  const highlights = useAppSelector((state) => state.networkHighlights);
  const dispatch = useAppDispatch();
  const retry = () => highlights.query && dispatch(highlightsRequested(highlights.query));
  return { ...highlights, dispatch, retry };
};

export const NeedsAttentionContainer = () => {
  const { status, data, alertFilter, dispatch, retry } = useHighlights();
  return (
    <SectionState status={status} what="las alertas" onRetry={retry}>
      {data && (
        <NeedsAttention
          firms={data.needsAttention}
          previousFiscalYear={data.previousFiscalYear}
          alertFilter={alertFilter}
          onAlertFilterChange={(filter) => dispatch(alertFilterChanged(filter))}
        />
      )}
    </SectionState>
  );
};

export const StandoutsContainer = () => {
  const { status, data, retry } = useHighlights();
  return (
    <SectionState status={status} what="las asesorías que destacan" onRetry={retry}>
      {data && (
        <Standouts
          standouts={data.standouts}
          needsAttention={data.needsAttention}
          previousFiscalYear={data.previousFiscalYear}
        />
      )}
    </SectionState>
  );
};

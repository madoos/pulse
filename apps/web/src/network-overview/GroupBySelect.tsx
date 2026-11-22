import type { GroupBy } from '@pulse/contracts';
import { Select } from '@pulse/design-system';
import { FilterGroup } from '@shared/period-filters/PeriodFilters';

const NONE = 'none';

export type GroupBySelectProps = {
  groupBy: GroupBy | null;
  onChange: (change: { groupBy: GroupBy | null }) => void;
};

/** How to break the network down: by specialty, by autonomous community or not at all. */
export const GroupBySelect = ({ groupBy, onChange }: GroupBySelectProps) => (
  <FilterGroup title="Desglose">
    <Select
      label="Agrupar por"
      options={[
        { id: NONE, label: 'Ninguno' },
        { id: 'specialty', label: 'Especialidad' },
        { id: 'autonomous-community', label: 'Comunidad autónoma' },
      ]}
      selectedKey={groupBy ?? NONE}
      onSelectionChange={(key) => onChange({ groupBy: key === NONE ? null : (key as GroupBy) })}
    />
  </FilterGroup>
);

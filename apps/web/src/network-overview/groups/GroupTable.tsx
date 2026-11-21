import type { GroupBy, GroupPerformance } from '@pulse/contracts';
import { Delta, Panel, Table, type TableColumn, type TableSort } from '@pulse/design-system';
import {
  formatChange,
  formatEuros,
  formatFiscalYear,
  formatNumber,
  formatPercent,
} from '@shared/format';

export type GroupTableProps = {
  groupBy: GroupBy;
  groups: GroupPerformance[];
  comparedYear: number | null;
  sort: TableSort;
  onSortChange: (sort: TableSort) => void;
};

const TITLES: Record<GroupBy, string> = {
  specialty: 'Especialidad',
  'autonomous-community': 'Comunidad autónoma',
};

const sortValue = (group: GroupPerformance, column: string): string | number => {
  switch (column) {
    case 'name':
      return group.name;
    case 'firms':
      return group.firms;
    case 'revenue':
      return group.summary.revenue;
    case 'revenuePerFirm':
      return group.revenuePerFirm;
    case 'revenuePerClient':
      return group.summary.revenuePerClient ?? -Infinity;
    case 'churnRate':
      return group.summary.churnRate ?? -Infinity;
    default:
      return group.revenueChange ?? -Infinity;
  }
};

export const sortGroups = (groups: GroupPerformance[], { column, direction }: TableSort) => {
  const order = direction === 'ascending' ? 1 : -1;
  return [...groups].sort((a, b) => {
    const [x, y] = [sortValue(a, column), sortValue(b, column)];
    const compared = typeof x === 'string' ? x.localeCompare(String(y), 'es') : x - Number(y);
    return compared * order;
  });
};

export const GroupTable = ({
  groupBy,
  groups,
  comparedYear,
  sort,
  onSortChange,
}: GroupTableProps) => {
  const columns: TableColumn[] = [
    { id: 'name', label: TITLES[groupBy], isRowHeader: true, allowsSorting: true },
    { id: 'firms', label: 'Asesorías', allowsSorting: true, align: 'end' },
    { id: 'revenue', label: 'Facturación', allowsSorting: true, align: 'end' },
    { id: 'revenuePerFirm', label: 'Facturación por asesoría', allowsSorting: true, align: 'end' },
    { id: 'revenuePerClient', label: 'Facturación por cliente', allowsSorting: true, align: 'end' },
    { id: 'churnRate', label: 'Bajas al mes', allowsSorting: true, align: 'end' },
    ...(comparedYear === null
      ? []
      : [
          {
            id: 'revenueChange',
            label: `Facturación vs ${formatFiscalYear(comparedYear)}`,
            allowsSorting: true,
            align: 'end' as const,
          },
        ]),
  ];
  const rows = sortGroups(groups, sort).map((group) => ({
    id: group.key,
    cells: {
      name: group.name,
      firms: formatNumber(group.firms),
      revenue: formatEuros(group.summary.revenue),
      revenuePerFirm: formatEuros(group.revenuePerFirm),
      revenuePerClient: formatEuros(group.summary.revenuePerClient),
      churnRate: formatPercent(group.summary.churnRate),
      revenueChange:
        group.revenueChange === null ? (
          'n/d'
        ) : (
          <Delta
            direction={group.revenueChange >= 0 ? 'up' : 'down'}
            tone={group.revenueChange >= 0 ? 'good' : 'bad'}
          >
            {formatChange(group.revenueChange)}
          </Delta>
        ),
    },
  }));
  return (
    <Panel
      title={`Por ${TITLES[groupBy].toLowerCase()}`}
      description="La facturación por asesoría separa el tamaño del grupo de su rendimiento."
    >
      <Table
        label={`Grupos por ${TITLES[groupBy].toLowerCase()}`}
        columns={columns}
        rows={rows}
        sort={sort}
        onSortChange={onSortChange}
      />
    </Panel>
  );
};

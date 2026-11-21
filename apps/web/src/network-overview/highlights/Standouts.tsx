import type { FirmNeedingAttention, Standout } from '@pulse/contracts';
import { Badge, Message, Panel, Table } from '@pulse/design-system';
import { formatChange, formatFiscalYear, formatPercent } from '@shared/format';
import { FirmLink } from './FirmLink';

export type StandoutsProps = {
  standouts: Standout[];
  needsAttention: FirmNeedingAttention[];
  previousFiscalYear: number | null;
};

const columns = [
  { id: 'firm', label: 'Asesoría', isRowHeader: true },
  { id: 'growth', label: 'Crecimiento en clientes', align: 'end' as const },
  { id: 'churn', label: 'Bajas al mes', align: 'end' as const },
  { id: 'attention', label: 'Atención' },
];

export const Standouts = ({ standouts, needsAttention, previousFiscalYear }: StandoutsProps) => {
  const flagged = new Set(needsAttention.map((f) => f.firm.id));
  return (
    <Panel
      title="Asesorías que destacan"
      description={
        previousFiscalYear === null
          ? undefined
          : `Las ${standouts.length} que más crecen en clientes activos frente a ${formatFiscalYear(previousFiscalYear)}.`
      }
    >
      {previousFiscalYear === null ? (
        <Message title="No hay un año anterior con el que comparar" />
      ) : (
        <Table
          label="Asesorías que más crecen en clientes"
          columns={columns}
          rows={standouts.map(({ firm, clientGrowth, churnRate }) => ({
            id: String(firm.id),
            cells: {
              firm: <FirmLink firm={firm} />,
              growth: formatChange(clientGrowth),
              churn: formatPercent(churnRate),
              attention: flagged.has(firm.id) ? (
                <Badge tone="danger">También necesita atención</Badge>
              ) : (
                ''
              ),
            },
          }))}
        />
      )}
    </Panel>
  );
};

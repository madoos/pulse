import type { FirmNeedingAttention, Standout } from '@pulse/contracts';
import { Badge, Message, Panel } from '@pulse/design-system';
import { FilterScope } from '@shared/period-filters/FilterScope';
import { formatChange, formatFiscalYear, formatPercent } from '@shared/format';
import { FirmCard, FirmCards } from './FirmCard';
import styles from './highlights.module.scss';

export type StandoutsProps = {
  standouts: Standout[];
  needsAttention: FirmNeedingAttention[];
  previousFiscalYear: number | null;
};

export const Standouts = ({ standouts, needsAttention, previousFiscalYear }: StandoutsProps) => {
  const flagged = new Set(needsAttention.map((f) => f.firm.id));
  return (
    <Panel
      title="Asesorías que destacan"
      description={
        previousFiscalYear === null
          ? undefined
          : `Las ${standouts.length} que más crecen en clientes activos frente a ${formatFiscalYear(previousFiscalYear)}, el año anterior.`
      }
      aside={<FilterScope uses={['period']} />}
    >
      {previousFiscalYear === null ? (
        <Message title="No hay un año anterior con el que comparar" />
      ) : (
        <FirmCards label="Asesorías que más crecen en clientes">
          {standouts.map(({ firm, clientGrowth, churnRate }) => (
            <FirmCard key={firm.id} firm={firm} tone="success">
              <p className={styles.highlights__growth}>
                {formatChange(clientGrowth)}
                <span className={styles.highlights__context}> clientes activos</span>
              </p>
              <p className={styles.highlights__context}>Bajas al mes: {formatPercent(churnRate)}</p>
              {flagged.has(firm.id) && <Badge tone="danger">También necesita atención</Badge>}
            </FirmCard>
          ))}
        </FirmCards>
      )}
    </Panel>
  );
};

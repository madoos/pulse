import { FISCAL_MONTHS, fiscalMonthIndex } from '@pulse/contracts';
import { Select } from '@pulse/design-system';
import { formatFiscalYear, formatMonthName } from '@shared/format';
import type { NetworkFilters as Filters } from './networkOverview.filters';
import styles from './network-overview.module.scss';

export type NetworkFiltersProps = {
  fiscalYears: number[];
  filters: Filters;
  onChange: (change: Partial<Filters>) => void;
};

const NONE = 'none';

const GROUP_NAMES = { specialty: 'especialidad', 'autonomous-community': 'comunidad autónoma' };

const monthOption = (month: number) => ({ id: String(month), label: formatMonthName(month) });

/** What the filters show, in words: "Estás viendo de abril a marzo de 2025-26…". */
export const describeFilters = ({
  fiscalYear,
  compareWith,
  fromMonth,
  toMonth,
  groupBy,
}: Filters) => {
  const months =
    fromMonth === 4 && toMonth === 3
      ? 'todo el año'
      : `de ${formatMonthName(fromMonth)} a ${formatMonthName(toMonth)}`;
  const comparison =
    compareWith === null
      ? ', sin comparar con otro año'
      : ` frente a los mismos meses de ${formatFiscalYear(compareWith)}`;
  const grouping = groupBy ? `, por ${GROUP_NAMES[groupBy]}` : '';
  return `Estás viendo ${months} ${formatFiscalYear(fiscalYear)}${comparison}${grouping}.`;
};

export const NetworkFilters = ({ fiscalYears, filters, onChange }: NetworkFiltersProps) => {
  const years = fiscalYears.map((year) => ({ id: String(year), label: formatFiscalYear(year) }));
  const toMonths = FISCAL_MONTHS.filter(
    (month) => fiscalMonthIndex(month) >= fiscalMonthIndex(filters.fromMonth),
  );
  return (
    <form className={styles['network-overview__filters']} aria-label="Filtros">
      <fieldset className={styles['network-overview__group']}>
        <legend className={styles['network-overview__group-title']}>Periodo</legend>
        <Select
          label="Año fiscal"
          options={years}
          selectedKey={String(filters.fiscalYear)}
          onSelectionChange={(key) => onChange({ fiscalYear: Number(key) })}
        />
        <Select
          label="Desde"
          options={FISCAL_MONTHS.map(monthOption)}
          selectedKey={String(filters.fromMonth)}
          onSelectionChange={(key) => onChange({ fromMonth: Number(key) })}
        />
        <Select
          label="Hasta"
          options={toMonths.map(monthOption)}
          selectedKey={String(filters.toMonth)}
          onSelectionChange={(key) => onChange({ toMonth: Number(key) })}
        />
      </fieldset>
      <fieldset className={styles['network-overview__group']}>
        <legend className={styles['network-overview__group-title']}>Comparación</legend>
        <Select
          label="Comparar con"
          options={[
            { id: NONE, label: 'Ninguno' },
            ...years.filter((year) => year.id !== String(filters.fiscalYear)),
          ]}
          selectedKey={filters.compareWith === null ? NONE : String(filters.compareWith)}
          onSelectionChange={(key) => onChange({ compareWith: key === NONE ? null : Number(key) })}
        />
      </fieldset>
      <fieldset className={styles['network-overview__group']}>
        <legend className={styles['network-overview__group-title']}>Desglose</legend>
        <Select
          label="Agrupar por"
          options={[
            { id: NONE, label: 'Ninguno' },
            { id: 'specialty', label: 'Especialidad' },
            { id: 'autonomous-community', label: 'Comunidad autónoma' },
          ]}
          selectedKey={filters.groupBy ?? NONE}
          onSelectionChange={(key) =>
            onChange({ groupBy: key === NONE ? null : (key as Filters['groupBy']) })
          }
        />
      </fieldset>
    </form>
  );
};

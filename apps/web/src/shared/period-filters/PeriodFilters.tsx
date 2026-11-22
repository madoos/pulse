import { FISCAL_MONTHS, fiscalMonthIndex } from '@pulse/contracts';
import { Select } from '@pulse/design-system';
import { formatFiscalYear, formatMonthName } from '@shared/format';
import type { ReactNode } from 'react';
import type { PeriodFilters as Filters } from './period.filters';
import styles from './period-filters.module.scss';

export type PeriodFiltersProps = {
  fiscalYears: number[];
  filters: Filters;
  onChange: (change: Partial<Filters>) => void;
  /** More groups of filters, after the period and the comparison. */
  children?: ReactNode;
};

const NONE = 'none';

const monthOption = (month: number) => ({ id: String(month), label: formatMonthName(month) });

/**
 * What the filters show, in words: "Estás viendo de abril a marzo de 2025-26…".
 * `more` adds what other filters do, such as ", por especialidad".
 */
export const describePeriod = (
  { fiscalYear, compareWith, fromMonth, toMonth }: Filters,
  more = '',
) => {
  const months =
    fromMonth === 4 && toMonth === 3
      ? 'todo el año'
      : `de ${formatMonthName(fromMonth)} a ${formatMonthName(toMonth)}`;
  const comparison =
    compareWith === null
      ? ', sin comparar con otro año'
      : ` frente a los mismos meses de ${formatFiscalYear(compareWith)}`;
  return `Estás viendo ${months} ${formatFiscalYear(fiscalYear)}${comparison}${more}.`;
};

/** A group of filters with its title, such as "Periodo". */
export const FilterGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className={styles['period-filters__group']}>
    <legend className={styles['period-filters__group-title']}>{title}</legend>
    {children}
  </fieldset>
);

/** The fiscal year, the months and the year to compare with. */
export const PeriodFilters = ({ fiscalYears, filters, onChange, children }: PeriodFiltersProps) => {
  const years = fiscalYears.map((year) => ({ id: String(year), label: formatFiscalYear(year) }));
  const toMonths = FISCAL_MONTHS.filter(
    (month) => fiscalMonthIndex(month) >= fiscalMonthIndex(filters.fromMonth),
  );
  return (
    <form className={styles['period-filters']} aria-label="Filtros">
      <FilterGroup title="Periodo">
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
      </FilterGroup>
      <FilterGroup title="Comparación">
        <Select
          label="Comparar con"
          options={[
            { id: NONE, label: 'Ninguno' },
            ...years.filter((year) => year.id !== String(filters.fiscalYear)),
          ]}
          selectedKey={filters.compareWith === null ? NONE : String(filters.compareWith)}
          onSelectionChange={(key) => onChange({ compareWith: key === NONE ? null : Number(key) })}
        />
      </FilterGroup>
      {children}
    </form>
  );
};

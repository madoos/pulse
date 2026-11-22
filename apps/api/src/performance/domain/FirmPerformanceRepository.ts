import type { MonthlyTotals } from './Totals';

/** One month of a single firm: the totals the network adds up, its tax filings and their incidents. */
export type FirmMonthlyTotals = MonthlyTotals & { taxFilings: number; taxAgencyIncidents: number };

/** One month of the other firms of a specialty, added up, with the employees of those firms. */
export type SpecialtyMonthlyTotals = FirmMonthlyTotals & { employees: number };

export type FirmPerformanceRepository = {
  /** The months of a firm, given as `YYYY-MM`, that have data. */
  monthlyTotals: (firmId: number, months: string[]) => Promise<FirmMonthlyTotals[]>;
  /** The months of the other firms of its specialty, added up; `firms` is how many had data. */
  specialtyTotals: (firmId: number, months: string[]) => Promise<SpecialtyMonthlyTotals[]>;
  /** The employees of a firm today, or null if there is no firm with that id. */
  employees: (firmId: number) => Promise<number | null>;
};

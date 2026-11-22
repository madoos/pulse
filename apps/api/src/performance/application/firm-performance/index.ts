import {
  addMonths,
  fiscalYearOf,
  monthsOf,
  withComparedYear,
  type FiscalPeriod,
} from '@performance/domain/FiscalPeriod';
import type {
  FirmMonthlyTotals,
  FirmPerformanceRepository,
  SpecialtyMonthlyTotals,
} from '@performance/domain/FirmPerformanceRepository';
import { alertsOfFirm, type Alert } from '@performance/domain/Highlights';
import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import {
  pointOf,
  summarize,
  totalsOf,
  type MonthlyPoint,
  type PeriodSummary,
} from '@performance/domain/Totals';

export type FirmPerformanceInput = FiscalPeriod & { firmId: number; compareWith?: number };

export type FirmMonthlyPoint = Omit<MonthlyPoint, 'firmsWithData'> & {
  taxFilings: number;
  revenuePerEmployee: number | null;
  incidentRate: number | null;
};

export type FirmSummary = PeriodSummary & {
  taxFilings: number;
  revenuePerEmployee: number | null;
  incidentRate: number | null;
};

export type FirmPerformance = {
  years: { fiscalYear: number; summary: FirmSummary; months: FirmMonthlyPoint[] }[];
  sixMonthsAgo: {
    current: FirmMonthlyPoint;
    previous: FirmMonthlyPoint | null;
    specialty: { current: FirmMonthlyPoint | null; previous: FirmMonthlyPoint | null };
  } | null;
  specialty: { firms: number; summary: FirmSummary; months: FirmMonthlyPoint[] };
  alerts: Alert[];
  alertsComparedWith: number | null;
};

export type GetFirmPerformance = (input: FirmPerformanceInput) => Promise<FirmPerformance>;

/** How far back the brief looks: "does it bill more or less than six months ago?" */
export const MONTHS_BACK = 6;

/** Revenue over the employees, who are only known as they are today. */
const perEmployee = (revenue: number, employees: number | null) =>
  employees ? revenue / employees : null;

/** Incidents with the tax agency over tax filings: how often filing goes wrong. */
const incidentRateOf = (incidents: number, filings: number) =>
  filings > 0 ? incidents / filings : null;

const firmPointOf = (month: FirmMonthlyTotals, employees: number | null): FirmMonthlyPoint => {
  const { activeClients, revenue, revenuePerClient, churnRate } = pointOf(month);
  return {
    month: month.month,
    activeClients,
    revenue,
    revenuePerClient,
    churnRate,
    taxFilings: month.taxFilings,
    revenuePerEmployee: perEmployee(revenue, employees),
    incidentRate: incidentRateOf(month.taxAgencyIncidents, month.taxFilings),
  };
};

/** The average firm of a month of a specialty: each total over the firms with data. */
const averageFirmOf = (month: SpecialtyMonthlyTotals) => {
  const per = (total: number) => total / month.firms;
  return {
    totals: {
      month: month.month,
      firms: 1,
      activeClients: per(month.activeClients),
      churnedClients: per(month.churnedClients),
      revenueCents: per(month.revenueCents),
      taxFilings: per(month.taxFilings),
      taxAgencyIncidents: per(month.taxAgencyIncidents),
    },
    employees: per(month.employees),
  };
};

/** The summary of some months of one firm, or of an average one, with these employees. */
const summaryOf = (months: FirmMonthlyTotals[], employees: number | null): FirmSummary => {
  const summary = summarize(totalsOf(months));
  const taxFilings = months.reduce((sum, m) => sum + m.taxFilings, 0);
  const incidents = months.reduce((sum, m) => sum + m.taxAgencyIncidents, 0);
  return {
    ...summary,
    taxFilings,
    revenuePerEmployee: perEmployee(summary.revenue, employees),
    incidentRate: incidentRateOf(incidents, taxFilings),
  };
};

const byMonth = <T extends { month: string }>(rows: T[]) =>
  [...rows].sort((a, b) => a.month.localeCompare(b.month));

/** The average firm of the rest of its specialty, month by month and for the period. */
const specialtyOf = (rows: SpecialtyMonthlyTotals[]) => {
  const months = byMonth(rows).map(averageFirmOf);
  const employees = months.length
    ? months.reduce((sum, m) => sum + m.employees, 0) / months.length
    : null;
  return {
    firms: rows.reduce((most, m) => Math.max(most, m.firms), 0),
    summary: summaryOf(
      months.map((m) => m.totals),
      employees,
    ),
    months: months.map((m) => firmPointOf(m.totals, m.employees)),
  };
};

const specialtyPointOf = (row: SpecialtyMonthlyTotals | undefined) => {
  if (!row) return null;
  const { totals, employees } = averageFirmOf(row);
  return firmPointOf(totals, employees);
};

/**
 * A firm measured as the network is, month by month and against the same months of another
 * year, plus its tax filings, how often they go wrong and its revenue per employee. It is also set against the average
 * firm of the rest of its specialty, which shares its seasonality; the last month with data is
 * compared with six months before, and the alerts follow the rules of the network.
 */
export const makeGetFirmPerformance =
  ({
    repository,
    network,
  }: {
    repository: FirmPerformanceRepository;
    network: NetworkPerformanceRepository;
  }): GetFirmPerformance =>
  async ({ firmId, compareWith, ...period }) => {
    const periods = withComparedYear(period, compareWith);
    const [rows, specialtyRows, employees, alerts] = await Promise.all([
      repository.monthlyTotals(firmId, periods.flatMap(monthsOf)),
      repository.specialtyTotals(firmId, monthsOf(period)),
      repository.employees(firmId),
      alertsFor(network, firmId, period),
    ]);
    const years = periods.map(({ fiscalYear }) => {
      const months = byMonth(rows.filter((row) => fiscalYearOf(row.month) === fiscalYear));
      return {
        fiscalYear,
        summary: summaryOf(months, employees),
        months: months.map((month) => firmPointOf(month, employees)),
      };
    });
    const specialty = specialtyOf(specialtyRows);

    const last = rows
      .filter((row) => fiscalYearOf(row.month) === period.fiscalYear)
      .reduce<FirmMonthlyTotals | null>((a, b) => (a && a.month > b.month ? a : b), null);
    if (!last) return { years, sixMonthsAgo: null, specialty, ...alerts };
    const sixMonthsBefore = addMonths(last.month, -MONTHS_BACK);
    const [[before], [specialtyBefore]] = await Promise.all([
      repository.monthlyTotals(firmId, [sixMonthsBefore]),
      repository.specialtyTotals(firmId, [sixMonthsBefore]),
    ]);
    return {
      years,
      sixMonthsAgo: {
        current: firmPointOf(last, employees),
        previous: before ? firmPointOf(before, employees) : null,
        specialty: {
          current: specialtyPointOf(specialtyRows.find((row) => row.month === last.month)),
          previous: specialtyPointOf(specialtyBefore),
        },
      },
      specialty,
      ...alerts,
    };
  };

/** The alerts always compare with the previous year, as in the network, whatever is compared. */
const alertsFor = async (
  network: NetworkPerformanceRepository,
  firmId: number,
  period: FiscalPeriod,
) => {
  const fiscalYears = await network.fiscalYears();
  const alertsComparedWith = fiscalYears.includes(period.fiscalYear - 1)
    ? period.fiscalYear - 1
    : null;
  const firms = await network.firmPeriods(period, alertsComparedWith);
  return { alerts: alertsOfFirm(firms, firmId), alertsComparedWith };
};

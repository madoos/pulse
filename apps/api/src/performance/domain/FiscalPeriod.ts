/** A range of months inside a fiscal year, which runs from April to March. */
export type FiscalPeriod = {
  fiscalYear: number;
  /** Calendar month (1-12). */
  fromMonth: number;
  /** Calendar month (1-12), not before `fromMonth` in fiscal order. */
  toMonth: number;
};

const fiscalIndex = (calendarMonth: number) => (calendarMonth + 8) % 12;

const pad = (value: number) => String(value).padStart(2, '0');

/** The month of a fiscal year as `YYYY-MM`: January to March belong to the following calendar year. */
export const monthOf = (fiscalYear: number, calendarMonth: number): string =>
  `${calendarMonth >= 4 ? fiscalYear : fiscalYear + 1}-${pad(calendarMonth)}`;

export const fiscalYearOf = (month: string) => {
  const [year, calendarMonth] = month.split('-').map(Number) as [number, number];
  return calendarMonth >= 4 ? year : year - 1;
};

/** The months of the period, in order. */
export const monthsOf = ({ fiscalYear, fromMonth, toMonth }: FiscalPeriod): string[] => {
  const months: string[] = [];
  for (let index = fiscalIndex(fromMonth); index <= fiscalIndex(toMonth); index++) {
    months.push(monthOf(fiscalYear, ((index + 3) % 12) + 1));
  }
  return months;
};

/** The same months in another fiscal year, so seasonality never looks like growth. */
export const sameMonthsIn = (period: FiscalPeriod, fiscalYear: number): FiscalPeriod => ({
  ...period,
  fiscalYear,
});

/** The periods to read: the given one and, if any, the same months of the compared year. */
export const withComparedYear = (period: FiscalPeriod, compareWith?: number): FiscalPeriod[] =>
  compareWith === undefined ? [period] : [period, sameMonthsIn(period, compareWith)];

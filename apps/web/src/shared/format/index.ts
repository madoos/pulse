/** Formatting for Spain: "16.608.337 €", "8.148", "1,7 %". */

const integer = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
});

const decimal = (digits: number) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: 'always',
  });

export const NOT_AVAILABLE = 'n/d';

/** A non-breaking space, so a number never wraps apart from its unit. */
const NBSP = '\u00a0';

export const formatNumber = (value: number) => integer.format(value);

export const formatEuros = (value: number | null) =>
  value === null ? NOT_AVAILABLE : euros.format(value);

/** A ratio as a percentage: 0.0167 is "1,7 %". */
export const formatPercent = (ratio: number | null, digits = 1) =>
  ratio === null ? NOT_AVAILABLE : `${decimal(digits).format(ratio * 100)}${NBSP}%`;

/** A signed change: 0.212 is "+21,2 %". */
export const formatChange = (ratio: number, digits = 1) => {
  const text = decimal(digits).format(Math.abs(ratio) * 100);
  return `${ratio < 0 ? '−' : '+'}${text}${NBSP}%`;
};

/** A signed difference in percentage points: -0.003 is "−0,3 p.p.". */
export const formatPoints = (difference: number) => {
  const text = decimal(1).format(Math.abs(difference) * 100);
  return `${difference < 0 ? '−' : '+'}${text}${NBSP}p.p.`;
};

/** Compact amounts for chart axes: "1,6 M", "450 k". */
export const formatCompactEuros = (value: number) => {
  if (Math.abs(value) >= 1e6) return `${decimal(1).format(value / 1e6)}${NBSP}M`;
  if (Math.abs(value) >= 1e3) return `${integer.format(value / 1e3)}${NBSP}k`;
  return integer.format(value);
};

/** A fiscal year by the calendar years it spans: 2025 is "2025-26". */
export const formatFiscalYear = (fiscalYear: number) =>
  `${fiscalYear}-${String((fiscalYear + 1) % 100).padStart(2, '0')}`;

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** A calendar month (1-12): 4 is "abril". */
export const formatMonthName = (calendarMonth: number) => MONTHS[calendarMonth - 1] ?? '';

/** A calendar month (1-12) for chart axes: 4 is "abr". */
export const formatShortMonth = (calendarMonth: number) =>
  formatMonthName(calendarMonth).slice(0, 3);

/** A month as YYYY-MM: "2025-04" is "abr 2025". */
export const formatMonth = (month: string) => {
  const [year, calendarMonth] = month.split('-').map(Number) as [number, number];
  return `${formatShortMonth(calendarMonth)} ${year}`;
};

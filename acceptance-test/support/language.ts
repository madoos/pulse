/** The specification is written in English; the application speaks Spanish. */

export const LABELS: Record<string, string> = {
  None: 'Ninguno',
  Specialty: 'Especialidad',
  'Autonomous community': 'Comunidad autónoma',
  'Compare with': 'Comparar con',
  'Group by': 'Agrupar por',
  'Losing clients': 'Pierde clientes',
  'High churn': 'Muchas bajas',
  'Falling revenue': 'Cae la facturación',
  'Losing value': 'Pierde valor por cliente',
  'Missing data': 'Sin datos',
};

export const label = (english: string) => LABELS[english] ?? english;

export const MONTHS: Record<string, { number: number; name: string; short: string }> = {
  January: { number: 1, name: 'enero', short: 'ene' },
  February: { number: 2, name: 'febrero', short: 'feb' },
  March: { number: 3, name: 'marzo', short: 'mar' },
  April: { number: 4, name: 'abril', short: 'abr' },
  May: { number: 5, name: 'mayo', short: 'may' },
  June: { number: 6, name: 'junio', short: 'jun' },
  July: { number: 7, name: 'julio', short: 'jul' },
  August: { number: 8, name: 'agosto', short: 'ago' },
  September: { number: 9, name: 'septiembre', short: 'sep' },
  October: { number: 10, name: 'octubre', short: 'oct' },
  November: { number: 11, name: 'noviembre', short: 'nov' },
  December: { number: 12, name: 'diciembre', short: 'dic' },
};

export const month = (english: string) => {
  const found = MONTHS[english.replace(/,$/, '')];
  if (!found) throw new Error(`Unknown month: ${english}`);
  return found;
};

/** "2025-26" (or "2025-26,") is the fiscal year 2025. */
export const fiscalYearOf = (text: string) => Number(text.slice(0, 4));

/** "2025-26," is "2025-26". */
export const yearLabel = (text: string) => text.replace(/,$/, '');

/** A list as written in a step: `"None", 2024-25 and 2023-24`. */
export const listOf = (text: string) =>
  text
    .split(/, | and /)
    .map((item) => item.trim().replace(/^"|"$/g, ''))
    .map(label);

/** "16.608.611 €" is 16608611. */
export const numberOf = (text: string) => Number(text.replace(/[^\d,]/g, '').replace(',', '.'));

/** A number with its sign, as the application writes changes: "−1,9 p.p." is -1.9. */
export const signedNumberOf = (text: string) =>
  /[−-]/.test(text) ? -numberOf(text) : numberOf(text);

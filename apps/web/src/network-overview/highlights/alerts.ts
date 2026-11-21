import type { Alert, AlertType } from '@pulse/contracts';
import { formatChange, formatEuros, formatNumber, formatPercent } from '@shared/format';

export const ALERT_LABELS: Record<AlertType, string> = {
  'losing-clients': 'Pierde clientes',
  'high-churn': 'Muchas bajas',
  'falling-revenue': 'Cae la facturación',
  'losing-value': 'Pierde valor por cliente',
  'missing-data': 'Sin datos',
};

const change = (value: number | null, reference: number | null) =>
  value === null || !reference ? '' : formatChange((value - reference) / reference);

/** What an alert says: its value and what it is compared with. */
export const describeAlert = ({
  type,
  value,
  reference,
}: Alert): { value: string; context: string } => {
  switch (type) {
    case 'losing-clients':
      return {
        value: change(value, reference),
        context: `${formatNumber(value ?? 0)} clientes, tenía ${formatNumber(reference ?? 0)} hace un año`,
      };
    case 'high-churn':
      return {
        value: `${formatPercent(value)} al mes`,
        context: `la red pierde un ${formatPercent(reference)}`,
      };
    case 'falling-revenue':
      return {
        value: change(value, reference),
        context: `${formatEuros(value)}, frente a ${formatEuros(reference)} hace un año`,
      };
    case 'losing-value':
      return {
        value: change(value, reference),
        context: `${formatEuros(value)} por cliente, frente a ${formatEuros(reference)} hace un año`,
      };
    case 'missing-data':
      return { value: '', context: 'no ha enviado los datos del último mes' };
  }
};

export const ALERT_RULES: { type: AlertType; rule: string }[] = [
  {
    type: 'losing-clients',
    rule: 'tiene menos clientes activos al final del periodo que en el mismo mes del año anterior.',
  },
  { type: 'high-churn', rule: 'sus bajas al mes son 1,5 veces las de la red o más.' },
  {
    type: 'falling-revenue',
    rule: 'factura menos que en los mismos meses del año anterior.',
  },
  {
    type: 'losing-value',
    rule: 'su facturación por cliente cae un 10 % o más frente a los mismos meses del año anterior.',
  },
  { type: 'missing-data', rule: 'no tiene datos del último mes del periodo.' },
];

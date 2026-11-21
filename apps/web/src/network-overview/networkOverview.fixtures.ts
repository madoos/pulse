import type {
  FirmNeedingAttention,
  GroupPerformance,
  MonthlyPoint,
  NetworkHighlights,
  NetworkPerformance,
} from '@pulse/contracts';

const point = (month: string, activeClients: number, revenue: number): MonthlyPoint => ({
  month,
  firmsWithData: 50,
  activeClients,
  revenue,
  revenuePerClient: revenue / activeClients,
  churnRate: 0.016,
});

export const performance2025: NetworkPerformance['years'][number] = {
  fiscalYear: 2025,
  summary: { activeClients: 8148, revenue: 16_600_000, revenuePerClient: 2201, churnRate: 0.015 },
  months: [point('2025-04', 6868, 1_337_243), point('2026-03', 8148, 1_623_873)],
};

export const performance2024: NetworkPerformance['years'][number] = {
  fiscalYear: 2024,
  summary: { activeClients: 7000, revenue: 13_700_000, revenuePerClient: 2100, churnRate: 0.0162 },
  months: [point('2024-04', 6000, 1_100_000), point('2025-03', 7000, 1_300_000)],
};

const firm = (id: number, name: string) => ({ id, name, specialty: 'Fiscal', province: 'Madrid' });

export const tinerfeno: FirmNeedingAttention = {
  firm: firm(1, 'Gabinete Fiscal Tinerfeño'),
  alerts: [
    { type: 'losing-clients', value: 238, reference: 248 },
    { type: 'falling-revenue', value: 300_000, reference: 320_000 },
  ],
};

export const manchega: FirmNeedingAttention = {
  firm: firm(2, 'Gestoria Manchega Integral'),
  alerts: [{ type: 'high-churn', value: 0.0819, reference: 0.0167 }],
};

export const highlights: NetworkHighlights = {
  previousFiscalYear: 2024,
  needsAttention: [tinerfeno, manchega],
  standouts: [
    { firm: firm(3, 'Asesoría Fiscal del Norte'), clientGrowth: 0.408, churnRate: 0.0228 },
    { firm: firm(2, 'Gestoria Manchega Integral'), clientGrowth: 0.2, churnRate: 0.0819 },
  ],
};

const group = (key: string, name: string, firms: number, revenue: number): GroupPerformance => ({
  key,
  name,
  firms,
  summary: { activeClients: 1000, revenue, revenuePerClient: 2000, churnRate: 0.016 },
  revenuePerFirm: revenue / firms,
  revenueChange: 0.1,
  months: [point('2025-04', 1000, revenue / 12)],
});

export const specialtyGroups: GroupPerformance[] = [
  group('fiscal', 'Fiscal', 24, 7_860_000),
  group('laboral', 'Laboral', 10, 4_100_000),
];

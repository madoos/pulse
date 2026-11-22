import { expect } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import type { FirmMonth } from '../support/database';
import { USER } from '../support/environment';
import { Given, Then, When } from '../support/fixtures';
import { numberOf, signedNumberOf } from '../support/language';

/** The fiscal year the detail shows by default: the most recent one, "2025-26". */
const latestYear = async (db: { fiscalYears: () => Promise<number[]> }) =>
  (await db.fiscalYears()).at(-1)!;

const yearLabel = (fiscalYear: number) => `${fiscalYear}-${String(fiscalYear + 1).slice(2)}`;

/** The month that is `count` months before a "YYYY-MM" month. */
const monthsBefore = (month: string, count: number) => {
  const [year, calendarMonth] = month.split('-').map(Number) as [number, number];
  const index = year * 12 + calendarMonth - 1 - count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};

const PROFILE: Record<string, { label: string; column: string }> = {
  'tax ID (CIF)': { label: 'CIF', column: 'tax_id' },
  province: { label: 'Provincia', column: 'province' },
  city: { label: 'Ciudad', column: 'city' },
  'onboarding date': { label: 'Alta', column: 'onboarded_on' },
  employees: { label: 'Empleados', column: 'employees' },
  specialty: { label: 'Especialidad', column: 'specialty' },
};

Given('there is an advisory firm with monthly metrics', async ({ db, memory }) => {
  memory.set('firmId', String(await db.firmWithMonths(12)));
});

Given('I am on its detail page', async ({ loginPage, firmDetail, memory }) => {
  await loginPage.logIn(USER);
  await firmDetail.open(Number(memory.get('firmId')));
});

Then('I see:', async ({ firmDetail, db, memory }, table: DataTable) => {
  const profile = await db.firmProfile(Number(memory.get('firmId')));
  for (const { field } of table.hashes()) {
    if (field === 'name') {
      expect(await firmDetail.name()).toBe(profile.name);
      continue;
    }
    const { label, column } = PROFILE[field!]!;
    expect(await firmDetail.field(label)).toBe(String(profile[column]));
  }
});

const METRICS: Record<string, { label: string; total: (months: FirmMonths) => number }> = {
  'active clients': { label: 'Clientes activos', total: (months) => months.at(-1)!.activeClients },
  revenue: { label: 'Facturación', total: (months) => months.reduce((s, m) => s + m.revenue, 0) },
  'tax filings': {
    label: 'Declaraciones',
    total: (months) => months.reduce((s, m) => s + m.taxFilings, 0),
  },
};

type FirmMonths = FirmMonth[];

Then(
  /^I see its (active clients|revenue|tax filings) month by month over the latest fiscal year$/,
  async ({ firmDetail, db, memory }, metric: string) => {
    const fiscalYear = await latestYear(db);
    const months = await db.firmMonths(Number(memory.get('firmId')), fiscalYear);
    const { label, total } = METRICS[metric]!;

    const chart = firmDetail.kpiChart(label);
    await expect.poll(() => chart.series()).toEqual([yearLabel(fiscalYear)]);
    const shown = await chart.months();
    expect([shown[0], shown.at(-1)]).toEqual(['abr', 'mar']);
    expect(months).toHaveLength(12);
    expect(await firmDetail.kpiNumber(label)).toBe(Math.round(total(months)));
  },
);

Then(
  'I see the revenue of the latest month compared with the month six months before',
  async ({ firmDetail, db, memory }) => {
    const id = Number(memory.get('firmId'));
    const months = await db.firmMonths(id, await latestYear(db));
    const latest = months.at(-1)!;
    const before = (await db.firmMonth(id, monthsBefore(latest.month, 6)))!;

    const { cells } = await firmDetail.sixMonthsAgo('Facturación');
    const [now, then, change] = cells;
    expect(numberOf(now!)).toBe(Math.round(latest.revenue));
    expect(numberOf(then!)).toBe(Math.round(before.revenue));
    const expected = ((latest.revenue - before.revenue) / before.revenue) * 100;
    expect(numberOf(change!)).toBeCloseTo(Math.abs(expected), 1);
  },
);

Then(
  "I see how its specialty's revenue changed in those same two months, and the difference in points",
  async ({ firmDetail, db, memory }) => {
    const id = Number(memory.get('firmId'));
    const months = await db.firmMonths(id, await latestYear(db));
    const latest = months.at(-1)!;
    const before = (await db.firmMonth(id, monthsBefore(latest.month, 6)))!;
    const specialtyNow = await db.specialtyAverageRevenueIn(id, latest.month);
    const specialtyBefore = await db.specialtyAverageRevenueIn(id, before.month);

    const own = (latest.revenue - before.revenue) / before.revenue;
    const specialty = (specialtyNow - specialtyBefore) / specialtyBefore;
    const { cells } = await firmDetail.sixMonthsAgo('Facturación');
    const [, , , specialtyChange, gap] = cells;
    expect(signedNumberOf(specialtyChange!)).toBeCloseTo(specialty * 100, 1);
    expect(signedNumberOf(gap!)).toBeCloseTo((own - specialty) * 100, 1);
  },
);

Then(
  'I see its revenue per employee: the revenue of the period over its employees',
  async ({ firmDetail, db, memory }) => {
    const id = Number(memory.get('firmId'));
    const months = await db.firmMonths(id, await latestYear(db));
    const { employees } = await db.firmProfile(id);
    const revenue = months.reduce((sum, m) => sum + m.revenue, 0);

    await expect
      .poll(() => firmDetail.kpiNumber('Facturación por empleado'))
      .toBe(Math.round(revenue / Number(employees)));
  },
);

Then(
  'I see how many of every 100 tax filings end in an incident with the tax agency',
  async ({ firmDetail, db, memory }) => {
    const months = await db.firmMonths(Number(memory.get('firmId')), await latestYear(db));
    const incidents = months.reduce((sum, m) => sum + (m.taxAgencyIncidents ?? 0), 0);
    const filings = months.reduce((sum, m) => sum + m.taxFilings, 0);

    await expect
      .poll(() => firmDetail.kpiNumber('Incidencias con Hacienda'))
      .toBe(Math.round((1000 * incidents) / filings) / 10);
  },
);

When(
  "I open an advisory firm whose churn is at least {float} times the network's",
  async ({ firmDetail, db, memory }, factor: number) => {
    const [name] = await db.firmsWithHighChurn(await latestYear(db), factor);
    const id = await db.firmIdNamed(name!);
    memory.set('firmId', String(id));
    await firmDetail.open(id);
  },
);

Then('I see the alert {string} in red', async ({ firmDetail }, label: string) => {
  await expect(await firmDetail.alert(label)).toBeVisible();
});

Then(
  'I see it against the average firm of the rest of its specialty',
  async ({ firmDetail, db, memory }) => {
    const { specialty } = await db.firmProfile(Number(memory.get('firmId')));
    await expect(firmDetail.specialtyLegend()).toContainText(`Media de ${specialty}`);
    await expect
      .poll(() => firmDetail.specialtyKpiChart('Facturación').series())
      .toEqual(expect.arrayContaining(['Esta asesoría']));
  },
);

Then(
  'the revenue of that average firm is the revenue of the other firms of its specialty over how many there are, month by month',
  async ({ firmDetail, db, memory }) => {
    const id = Number(memory.get('firmId'));
    const expected = await db.specialtyAverageRevenue(id, await latestYear(db));
    await expect.poll(() => firmDetail.specialtyValue('Facturación')).toBe(Math.round(expected));
  },
);

When('I compare with {string}', async ({ firmDetail }, year: string) => {
  await firmDetail.compareWith(year);
});

Then(
  'every chart has a line for {string} and one for {string}',
  async ({ firmDetail }, selected: string, compared: string) => {
    await expect(firmDetail.kpiLabels()).toHaveCount(7);
    for (const label of Object.values(METRICS).map((m) => m.label)) {
      await expect
        .poll(() => firmDetail.kpiChart(label).series())
        .toEqual([compared, selected].toSorted());
    }
  },
);

Given(
  'I opened the detail from the advisory firm listing',
  async ({ networkOverview, app, firmsListing, memory, page, db }) => {
    const inMadrid = (await db.firms()).filter((firm) => firm.province === 'Madrid');
    await networkOverview.open();
    await app.openFirms();
    await firmsListing.filterBy('Provincia', 'Madrid');
    await expect(page).toHaveURL(/province=/);
    // The counter changes once the filtered page arrives.
    await expect.poll(() => firmsListing.total()).toBe(inMadrid.length);
    const first = inMadrid[0];
    memory.set('listing', page.url());
    await firmsListing.openFirm(first!.name);
  },
);

Then(
  'I return to the listing with its search and filters',
  async ({ firmsListing, page, memory }) => {
    await expect(firmsListing.drawer).toBeVisible();
    expect(page.url()).toBe(memory.get('listing'));
    for (const firm of await firmsListing.visibleFirms()) expect(firm.province).toBe('Madrid');
  },
);

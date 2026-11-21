import { expect } from '@playwright/test';
import { KPIS } from '../pages/NetworkOverviewPage';
import { Given, Then, When } from '../support/fixtures';
import { fiscalYearOf, label, listOf, month, numberOf, yearLabel } from '../support/language';

/** The selected year of a scenario, while the specification does not choose another one. */
const SELECTED_YEAR = 2025;
const HIGH_CHURN_FACTOR = 1.5;

// ---------- Data ----------

Given(
  'there are advisory firms with metrics for the fiscal years {word} {word} and {word}',
  async ({ db }, first: string, second: string, third: string) => {
    expect(await db.fiscalYears()).toEqual([first, second, third].map(fiscalYearOf));
  },
);

Given(
  "the network's revenue is {string} in {word} and {string} in {word}",
  async ({ db }, revenue: string, year: string, comparedRevenue: string, comparedYear: string) => {
    // The data comes from the seeds: this checks the scenario still describes them.
    expect(Math.round(await db.revenueOf(fiscalYearOf(year)))).toBe(numberOf(revenue));
    expect(Math.round(await db.revenueOf(fiscalYearOf(comparedYear)))).toBe(
      numberOf(comparedRevenue),
    );
  },
);

Given(
  'the network has {int} active clients in {word} {int} and {int} in {word} {int}',
  async (
    { db },
    first: number,
    firstMonth: string,
    firstYear: number,
    last: number,
    lastMonth: string,
    lastYear: number,
  ) => {
    const key = (name: string, year: number) =>
      `${year}-${String(month(name).number).padStart(2, '0')}`;
    expect(await db.activeClientsIn(key(firstMonth, firstYear))).toBe(first);
    expect(await db.activeClientsIn(key(lastMonth, lastYear))).toBe(last);
  },
);

// ---------- Filters ----------

Given(
  '{word} is compared with {word}',
  async ({ networkOverview }, selected: string, compared: string) => {
    await networkOverview.selectYear(selected);
    await networkOverview.compareWith(compared);
  },
);

When('I select {word} as the year', async ({ networkOverview }, year: string) => {
  await networkOverview.selectYear(year);
});

When(
  'I filter the months from {word} to {word}',
  async ({ networkOverview }, from: string, to: string) => {
    await networkOverview.filterMonths(month(from).name, month(to).name);
  },
);

When('I group by {}', async ({ networkOverview }, groupBy: string) => {
  await networkOverview.groupBy(label(groupBy[0]!.toUpperCase() + groupBy.slice(1)));
});

When('I open the {string} selector', async ({ networkOverview, memory }, name: string) => {
  const { options, multiple } = await networkOverview.openFilter(label(name));
  memory.set('options', JSON.stringify(options));
  memory.set('multiple', String(multiple));
});

// The specification lists the options; their order is the view's.
const sameOptions = (options: string[], list: string) =>
  expect(options.toSorted()).toEqual(listOf(list).toSorted());

Then('it offers {}', async ({ memory }, list: string) => {
  sameOptions(JSON.parse(memory.get('options') ?? '[]'), list);
});

Then('it does not offer the selected year', async ({ networkOverview, memory }) => {
  await networkOverview.closeFilter();
  const selected = await networkOverview.selected('Año fiscal');
  expect(JSON.parse(memory.get('options') ?? '[]')).not.toContain(selected);
});

Then('I can only pick one of them', async ({ memory }) => {
  expect(memory.get('multiple')).toBe('false');
});

Then(
  'the {string} selector only offers {}',
  async ({ networkOverview }, name: string, list: string) => {
    const { options } = await networkOverview.openFilter(label(name));
    await networkOverview.closeFilter();
    sameOptions(options, list);
  },
);

Then('the year selector offers {}', async ({ networkOverview }, list: string) => {
  const { options } = await networkOverview.openFilter('Año fiscal');
  await networkOverview.closeFilter();
  sameOptions(options, list);
});

Then('{word} is selected by default', async ({ networkOverview }, year: string) => {
  expect(await networkOverview.selected('Año fiscal')).toBe(yearLabel(year));
});

Then('no year is selected to compare with', async ({ networkOverview }) => {
  expect(await networkOverview.selected('Comparar con')).toBe('Ninguno');
});

Then('I read {string}', async ({ networkOverview }, text: string) => {
  await expect(networkOverview.summary()).toHaveText(text);
});

// ---------- KPIs ----------

Then('the KPIs and charts only show {word}', async ({ networkOverview }, year: string) => {
  for (const kpi of KPIS) {
    await expect(networkOverview.kpi(kpi)).not.toContainText('antes');
    expect(await networkOverview.kpiChart(kpi).series(), kpi).toEqual([yearLabel(year)]);
  }
});

Then(
  'the small chart of each KPI shows one line for {word} and another for {word}',
  async ({ networkOverview }, selected: string, compared: string) => {
    for (const kpi of KPIS) {
      await expect
        .poll(() => networkOverview.kpiChart(kpi).series(), { message: kpi })
        .toEqual([compared, selected].toSorted());
    }
  },
);

Then('it has a vertical scale and the months of the period below', async ({ networkOverview }) => {
  for (const kpi of KPIS) {
    const chart = networkOverview.kpiChart(kpi);
    expect((await chart.scale()).length, kpi).toBeGreaterThan(1);
    const months = await chart.months();
    expect([months[0], months.at(-1)], kpi).toEqual(['abr', 'mar']);
  }
});

Then(
  'the KPIs and charts only use {word} {word} and {word} of the selected year',
  async ({ networkOverview, db, memory }, first: string, second: string, third: string) => {
    const months = [first, second, third].map(month);
    memory.set('months', JSON.stringify(months.map((m) => m.number)));
    await expect
      .poll(() => networkOverview.kpiChart('Facturación').months())
      .toEqual(months.map((m) => m.short));
    const revenue = await db.revenueOfMonths(
      SELECTED_YEAR,
      months.map((m) => m.number),
    );
    await expect.poll(() => networkOverview.kpiNumber('Facturación')).toBe(Math.round(revenue));
  },
);

Then('the compared year uses the same months', async ({ networkOverview, db, memory }) => {
  const months: number[] = JSON.parse(memory.get('months') ?? '[]');
  await networkOverview.compareWith('2024-25');
  const revenue = await db.revenueOfMonths(SELECTED_YEAR - 1, months);
  const before = new Intl.NumberFormat('es-ES').format(Math.round(revenue));
  await expect(networkOverview.kpi('Facturación')).toContainText(`antes ${before}`);
});

Then(
  "the network's active clients for {word} are {int}",
  async ({ networkOverview }, year: string, clients: number) => {
    await networkOverview.selectYear(year);
    await expect.poll(() => networkOverview.kpiNumber('Clientes activos')).toBe(clients);
  },
);

Then('the revenue KPI shows {string}', async ({ networkOverview }, text: string) => {
  // The arrow is drawn apart from the text: "▲ +22,2 %" reads "▲+22,2 %" in the page.
  const arrow = ['▲', '▼', '■'].find((symbol) => text.startsWith(symbol)) ?? '';
  const change = text.slice(arrow.length).trimStart();
  await expect(networkOverview.kpi('Facturación')).toContainText(`${arrow}${change}`);
});

// ---------- Groups ----------

Then(
  'I only see the autonomous communities that have advisory firms',
  async ({ networkOverview, db }) => {
    const expected = await db.communitiesWithFirms();
    const shown = await networkOverview.groups.groupNames();
    expect(shown.toSorted((a, b) => a.localeCompare(b, 'es'))).toEqual(
      expected.toSorted((a, b) => a.localeCompare(b, 'es')),
    );
  },
);

Then('the group panel appears right after the filters, closed', async ({ networkOverview }) => {
  await expect(networkOverview.groups.root).toBeVisible();
  const titles = await networkOverview.panelTitles();
  expect(titles[titles.indexOf('Filtros') + 1]).toMatch(/^Por /);
  expect(await networkOverview.groups.isExpanded()).toBe(false);
});

Then(
  'it sums the groups up in one line: how many, and the best and worst by revenue per advisory firm',
  async ({ networkOverview, db }) => {
    const count = await db.specialtyCount();
    await expect(networkOverview.groups.root).toContainText(
      new RegExp(`${count} especialidades · más facturación por asesoría: .+ · menos: .+`),
    );
  },
);

When('I open it', async ({ networkOverview }) => {
  await networkOverview.groups.open();
});

Then('I see the group table', async ({ networkOverview, db }) => {
  await expect(networkOverview.groups.table.getByRole('rowheader')).toHaveCount(
    await db.specialtyCount(),
  );
});

// ---------- Highlights ----------

When(
  'I filter the advisory firms that need attention by {string}',
  async ({ networkOverview }, alert: string) => {
    await networkOverview.needsAttention.filterBy(label(alert));
  },
);

Then('I only see the advisory firms with a high churn', async ({ networkOverview, db }) => {
  const expected = await db.firmsWithHighChurn(SELECTED_YEAR, HIGH_CHURN_FACTOR);
  expect(expected.length).toBeGreaterThan(0);
  const shown = await networkOverview.needsAttention.firmNames();
  expect(shown.toSorted()).toEqual(expected);
});

Then('each filter shows how many advisory firms have that alert', async ({ networkOverview }) => {
  const panel = networkOverview.needsAttention;
  for (const { label: alert, count } of await panel.chips()) {
    await panel.filterBy(alert);
    expect(await panel.firmNames(), alert).toHaveLength(count);
  }
});

Then(
  'I see the {int} advisory firms with the highest active client growth',
  async ({ networkOverview, db }, count: number) => {
    // The default period ends in March 2026, compared with March 2025.
    const expected = await db.topClientGrowth('2026-03', '2025-03', count);
    await expect.poll(() => networkOverview.standouts.firmNames()).toEqual(expected);
  },
);

Then('each one shows its client growth and its mean monthly churn', async ({ networkOverview }) => {
  for (const card of await networkOverview.standouts.cards.all()) {
    await expect(card).toContainText(/[+−]\d+,\d\s%\sclientes activos/);
    await expect(card).toContainText(/Bajas al mes: \d+,\d\s%/);
  }
});

Then('the ones that also need attention are marked', async ({ networkOverview }) => {
  const flagged = new Set(await networkOverview.needsAttention.firmNames());
  for (const card of await networkOverview.standouts.cards.all()) {
    const name = (await card.getByRole('link').innerText()).trim();
    const badge = card.getByText('También necesita atención');
    await (flagged.has(name) ? expect(badge).toBeVisible() : expect(badge).toHaveCount(0));
  }
});

Then(
  'the advisory firms that stand out show that there is no previous year to compare with',
  async ({ networkOverview }) => {
    await expect(networkOverview.standouts.root).toContainText(
      'No hay un año anterior con el que comparar',
    );
  },
);

// ---------- Navigation ----------

When(
  'I click on an advisory firm among the ones that need attention',
  async ({ networkOverview, memory }) => {
    const [first] = await networkOverview.needsAttention.firmNames();
    if (!first) throw new Error('No advisory firm needs attention in the seeds');
    memory.set('firm', first);
    await networkOverview.needsAttention.openFirm(first);
  },
);

When(
  'I click on an advisory firm among the ones that stand out',
  async ({ networkOverview, memory }) => {
    const [first] = await networkOverview.standouts.firmNames();
    if (!first) throw new Error('No advisory firm stands out in the seeds');
    memory.set('firm', first);
    await networkOverview.standouts.openFirm(first);
  },
);

Then(
  'from the menu I can go to the listing and to the network overview from any screen',
  async ({ app, networkOverview, firmDetail, db }) => {
    await app.openFirms();
    await app.closeFirms();
    await firmDetail.open(await db.firmWithMonths(1));
    await app.openFirms();
    await app.closeFirms();
    await app.goToNetworkOverview();
    await networkOverview.expectShown();
  },
);

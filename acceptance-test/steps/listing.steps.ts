import { expect } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import type { ListedFirmRow } from '../support/database';
import type { AppFrame } from '../pages/AppFrame';
import type { LoginPage } from '../pages/LoginPage';
import type { NetworkOverviewPage } from '../pages/NetworkOverviewPage';
import { USER } from '../support/environment';
import { Given, Then, When } from '../support/fixtures';

/** Lower case and without accents, as the search compares. */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const FIELDS: Record<string, 'province' | 'specialty'> = {
  province: 'province',
  specialty: 'specialty',
};

const FILTER_LABELS: Record<string, string> = { province: 'Provincia', specialty: 'Especialidad' };

type Pages = { loginPage: LoginPage; networkOverview: NetworkOverviewPage; app: AppFrame };

const openListing = async ({ loginPage, networkOverview, app }: Pages) => {
  await loginPage.logIn(USER);
  await networkOverview.open();
  await app.openFirms();
};

When(
  'I open {string} in the sidebar',
  async ({ loginPage, networkOverview, app }, link: string) => {
    await loginPage.logIn(USER);
    await networkOverview.open();
    await app.openFromSidebar(link);
  },
);

When('I open the advisory firm listing', async ({ loginPage, networkOverview, app }) =>
  openListing({ loginPage, networkOverview, app }),
);

Given('I am on the listing', async ({ loginPage, networkOverview, app }) =>
  openListing({ loginPage, networkOverview, app }),
);

Then('I see the {int} advisory firms', async ({ firmsListing, db }, count: number) => {
  const expected = await db.firms();
  expect(expected).toHaveLength(count);

  expect(await firmsListing.total()).toBe(count);
  const firms = await firmsListing.allFirms();
  expect(firms.map((f) => f.id).sort((a, b) => a - b)).toEqual(
    expected.map((f) => f.id).sort((a, b) => a - b),
  );
});

Then('each advisory firm shows:', async ({ firmsListing, db }, table: DataTable) => {
  const fields = table.hashes().map((row) => row.field as keyof ListedFirmRow);
  const shown = await firmsListing.visibleFirms();
  const byId = new Map((await db.firms()).map((firm) => [firm.id, firm]));

  expect(shown.length).toBeGreaterThan(0);
  for (const firm of shown) {
    const expected = byId.get(firm.id)!;
    for (const field of fields) expect(firm[field]).toBe(expected[field]);
  }
});

Given('there is an advisory firm named {string}', async ({ db }, name: string) => {
  await db.firmIdNamed(name);
});

When('I search for {string}', async ({ firmsListing }, text: string) => {
  await firmsListing.search(text);
});

Then('the listing includes {string}', async ({ firmsListing }, name: string) => {
  await expect(firmsListing.drawer.getByRole('row', { name: new RegExp(name) })).toBeVisible();
});

Then(
  'every advisory firm in the listing contains {string} in its name',
  async ({ firmsListing, db }, text: string) => {
    const expected = (await db.firms()).filter((firm) => plain(firm.name).includes(plain(text)));
    await expect.poll(() => firmsListing.total()).toBe(expected.length);

    const firms = await firmsListing.allFirms();
    expect(firms.map((f) => f.name).sort()).toEqual(expected.map((f) => f.name).sort());
  },
);

When('I filter by {word} {string}', async ({ firmsListing }, filter: string, value: string) => {
  await firmsListing.filterBy(FILTER_LABELS[filter]!, value);
});

Then(
  'every advisory firm in the listing has {word} {string}',
  async ({ firmsListing, db, page }, filter: string, value: string) => {
    const field = FIELDS[filter]!;
    const expected = (await db.firms()).filter((firm) => firm[field] === value);
    await expect(page).toHaveURL(new RegExp(`${filter}=`));
    await expect.poll(() => firmsListing.total()).toBe(expected.length);

    const firms = await firmsListing.allFirms();
    expect(firms.map((f) => f[field])).toEqual(expected.map(() => value));
    expect(firms.map((f) => f.id).sort((a, b) => a - b)).toEqual(
      expected.map((f) => f.id).sort((a, b) => a - b),
    );
  },
);

When('I click on an advisory firm', async ({ firmsListing, memory }) => {
  const [first] = await firmsListing.visibleFirms();
  memory.set('firm', first!.name);
  await firmsListing.openFirm(first!.name);
});

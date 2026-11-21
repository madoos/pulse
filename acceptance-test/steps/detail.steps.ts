import { expect } from '@playwright/test';
import { USER } from '../support/environment';
import { Given, Then, When } from '../support/fixtures';

Given(
  'there is an advisory firm with {int} months of metrics',
  async ({ db, memory }, months: number) => {
    memory.set('firmId', String(await db.firmWithMonths(months)));
  },
);

Given('I am on its detail page', async ({ loginPage, firmDetail, memory }) => {
  await loginPage.logIn(USER);
  await firmDetail.open(Number(memory.get('firmId')));
});

When("I open the advisory firm's detail page URL directly", async ({ firmDetail, memory }) => {
  await firmDetail.open(Number(memory.get('firmId')));
});

Given('I opened the detail page URL directly', async ({ firmDetail, memory }) => {
  await firmDetail.open(Number(memory.get('firmId')));
});

Then(
  'I see its detail page without going through the listing',
  async ({ firmDetail, app, memory }) => {
    await firmDetail.expectOpenFor(Number(memory.get('firmId')));
    await expect(app.firmsDrawer).toBeHidden();
  },
);

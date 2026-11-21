import { expect } from '@playwright/test';
import { USER } from '../support/environment';
import { Given, Then, When } from '../support/fixtures';

Given('I am on the network overview', async ({ loginPage, networkOverview }) => {
  await loginPage.logIn(USER);
  await networkOverview.open();
});

Given('there are {int} advisory firms loaded in Pulse', async ({ db }, count: number) => {
  expect(await db.firmCount()).toBe(count);
});

When('I click {string}', async ({ page }, name: string) => {
  await page
    .getByRole('link', { name: new RegExp(name) })
    .or(page.getByRole('button', { name }))
    .click();
});

Then('the detail page of that advisory firm opens', async ({ firmDetail, db, memory }) => {
  await firmDetail.expectOpenFor(await db.firmIdNamed(memory.get('firm') ?? ''));
});

Then('I go to the network overview', async ({ page, networkOverview }) => {
  await expect(page).toHaveURL(/\/$/);
  await networkOverview.expectShown();
});

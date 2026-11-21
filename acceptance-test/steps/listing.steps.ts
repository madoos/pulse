import { expect } from '@playwright/test';
import { Then, When } from '../support/fixtures';

When('I search for {string} in the page header', async ({ networkOverview }, text: string) => {
  await networkOverview.search(text);
});

Then('the advisory firm listing opens with the search {string}', async ({ app }, text: string) => {
  await expect(app.firmsDrawer).toBeVisible();
  await expect(app.firmsSearch()).toHaveValue(text);
});

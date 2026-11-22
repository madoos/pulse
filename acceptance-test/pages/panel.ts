import type { Page } from '@playwright/test';

/** Opens a panel that starts closed, by its title. Does nothing if it is already open. */
export const openPanel = async (page: Page, title: string) => {
  const toggle = page.getByRole('button', { name: title, exact: true, expanded: false });
  if (await toggle.isVisible()) await toggle.click();
};

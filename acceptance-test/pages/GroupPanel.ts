import { expect, type Locator, type Page } from '@playwright/test';

/** The panel of the groups, shown while the network is grouped. */
export class GroupPanel {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('region', { name: /^Por / });
  }

  private get toggle() {
    return this.root.getByRole('button', { name: /^Por / });
  }

  async isExpanded() {
    return (await this.toggle.getAttribute('aria-expanded')) === 'true';
  }

  async open() {
    if (!(await this.isExpanded())) await this.toggle.click();
    await expect(this.table).toBeVisible();
  }

  get table() {
    return this.root.getByRole('grid');
  }

  /** The names of the groups in the table. */
  async groupNames() {
    await this.open();
    return (await this.table.getByRole('rowheader').allInnerTexts()).map((name) => name.trim());
  }
}

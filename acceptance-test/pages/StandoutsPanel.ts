import type { Locator, Page } from '@playwright/test';

/** The panel of the advisory firms that grow the most. */
export class StandoutsPanel {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('region', { name: 'Asesorías que destacan' });
  }

  get cards() {
    return this.root
      .getByRole('list', { name: 'Asesorías que más crecen en clientes' })
      .getByRole('listitem');
  }

  async firmNames() {
    return (await this.root.getByRole('link').allInnerTexts()).map((name) => name.trim());
  }

  async openFirm(name: string) {
    await this.root.getByRole('link', { name, exact: true }).click();
  }
}

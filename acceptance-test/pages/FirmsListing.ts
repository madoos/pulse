import { expect, type Locator, type Page } from '@playwright/test';

/** An advisory firm as a row of the listing shows it. */
export type ListedFirm = {
  id: number;
  name: string;
  city: string;
  province: string;
  specialty: string;
  employees: number;
};

/**
 * The listing of advisory firms, in its drawer. The list is virtual and loaded page by
 * page, so reading every firm means scrolling down to the end.
 */
export class FirmsListing {
  constructor(private readonly page: Page) {}

  get drawer() {
    return this.page.getByRole('dialog', { name: 'Asesorías' });
  }

  private get list() {
    return this.drawer.getByRole('grid', { name: 'Asesorías' });
  }

  /** The rows of firms in the DOM, which are only the ones in view. */
  private get rows() {
    return this.list.locator('[role="row"][data-href]');
  }

  async search(text: string) {
    await this.drawer.getByRole('searchbox', { name: 'Buscar asesoría' }).fill(text);
  }

  async filterBy(filter: string, value: string) {
    await this.drawer.getByRole('button', { name: new RegExp(filter) }).click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  /** The number of firms the drawer says match, once the listing has loaded. */
  async total(): Promise<number> {
    const counter = this.drawer.getByText(/^[\d.]+ asesorías?$/);
    await expect(counter).toBeVisible();
    return Number((await counter.innerText()).split(' ')[0]!.replaceAll('.', ''));
  }

  /** The firms in view, from the top of the list. */
  async visibleFirms(): Promise<ListedFirm[]> {
    await expect(this.rows.first()).toBeVisible();
    const rows = await this.rows.all();
    return Promise.all(rows.map((row) => this.read(row)));
  }

  /** Every firm that matches, scrolling down so the next pages load. */
  async allFirms(): Promise<ListedFirm[]> {
    const total = await this.total();
    const seen = new Map<number, ListedFirm>();
    await expect(
      this.rows.first().or(this.drawer.getByText('Ninguna asesoría coincide')),
    ).toBeVisible();
    for (let attempt = 0; seen.size < total && attempt < 200; attempt++) {
      for (const firm of await this.visibleFirms()) seen.set(firm.id, firm);
      await this.list.evaluate((list) => list.scrollBy(0, list.clientHeight));
      await this.page.waitForTimeout(50);
    }
    return [...seen.values()];
  }

  async openFirm(name: string) {
    await this.rows.filter({ hasText: name }).first().click();
  }

  private async read(row: Locator): Promise<ListedFirm> {
    const href = (await row.getAttribute('data-href')) ?? '';
    const [name = '', place = '', specialty = '', employees = ''] = (await row.innerText())
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const [city = '', province = ''] = place.split(' · ');
    return {
      id: Number(href.split('/').at(-1)),
      name,
      city,
      province,
      specialty,
      employees: Number(employees.split(' ')[0]!.replaceAll('.', '')),
    };
  }
}

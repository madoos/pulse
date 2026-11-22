import { expect, type Locator, type Page } from '@playwright/test';
import { openPanel } from './panel';

export type AlertChip = { label: string; count: number };

/** The panel of the advisory firms that need attention, inside the network overview. */
export class NeedsAttentionPanel {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('region', { name: 'Necesitan atención' });
  }

  private get cards() {
    return this.root.getByRole('list', { name: 'Asesorías que necesitan atención' });
  }

  /** It starts closed. */
  async open() {
    await expect(this.root).toBeVisible();
    await openPanel(this.page, 'Necesitan atención');
  }

  async filterBy(alert: string) {
    await this.open();
    await this.root.getByRole('radio', { name: new RegExp(`^${alert} \\d+$`) }).click();
  }

  /** The filters by type of alert, with how many advisory firms each one has. */
  async chips(): Promise<AlertChip[]> {
    await this.open();
    const names = await this.root.getByRole('radio').allInnerTexts();
    // Each filter reads "Muchas bajas 2": its label, then its count.
    return names.map((name) => {
      const words = name.trim().split(/\s+/);
      const count = Number(words.pop());
      return { label: words.join(' '), count };
    });
  }

  /** The names of the advisory firms shown, all of them, opening "Ver todas" if there are more. */
  async firmNames(): Promise<string[]> {
    await this.open();
    const showAll = this.root.getByRole('button', { name: /^Ver todas/ });
    if (await showAll.isVisible()) await showAll.click();
    if (!(await this.cards.isVisible())) return [];
    return (await this.cards.getByRole('link').allTextContents()).map((name) => name.trim());
  }

  async openFirm(name: string) {
    await this.open();
    await this.cards.getByRole('link', { name, exact: true }).click();
  }
}

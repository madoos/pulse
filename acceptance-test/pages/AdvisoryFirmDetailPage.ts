import { expect, type Page } from '@playwright/test';

/** The detail page of an advisory firm. */
export class AdvisoryFirmDetailPage {
  constructor(private readonly page: Page) {}

  async open(id: number) {
    await this.page.goto(`/advisory-firms/${id}`);
    await this.expectOpenFor(id);
  }

  async expectOpenFor(id: number) {
    await expect(this.page).toHaveURL(new RegExp(`/advisory-firms/${id}$`));
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async goBack() {
    await this.page.getByRole('link', { name: /Volver/ }).click();
  }
}

import { expect, type Page } from '@playwright/test';

/** What every page behind the login shares: the sidebar and the drawer of advisory firms. */
export class AppFrame {
  constructor(private readonly page: Page) {}

  async goToNetworkOverview() {
    await this.page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Vista de red' })
      .click();
  }

  async openFromSidebar(name: string) {
    await this.page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name })
      .click();
  }

  async openFirms() {
    await this.openFromSidebar('Asesorías');
    await expect(this.firmsDrawer).toBeVisible();
  }

  get firmsDrawer() {
    return this.page.getByRole('dialog', { name: 'Asesorías' });
  }

  firmsSearch() {
    return this.firmsDrawer.getByRole('searchbox', { name: 'Buscar asesoría' });
  }

  async closeFirms() {
    await this.firmsDrawer.getByRole('button', { name: 'Cerrar' }).click();
    await expect(this.firmsDrawer).toBeHidden();
  }
}

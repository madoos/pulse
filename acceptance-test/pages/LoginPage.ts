import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async logIn({ email, password }: { email: string; password: string }) {
    await this.page.goto('/login');
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
    await this.page.getByLabel('Contraseña').fill(password);
    await this.page.getByRole('button', { name: 'Entrar' }).click();
    // Checking a password is slow on purpose, more so with several tests logging in at once.
    await expect(this.page).not.toHaveURL(/\/login$/, { timeout: 20_000 });
  }
}

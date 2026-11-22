import { expect, type Page } from '@playwright/test';
import { LineChartObject } from './LineChartObject';

/** The detail page of an advisory firm. */
export class AdvisoryFirmDetailPage {
  constructor(private readonly page: Page) {}

  async open(id: number) {
    await this.page.goto(`/advisory-firms/${id}`);
    await this.expectOpenFor(id);
  }

  async expectOpenFor(id: number) {
    await expect(this.page).toHaveURL(new RegExp(`/advisory-firms/${id}(\\?|$)`));
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async goBack() {
    await this.page.getByRole('link', { name: /Volver/ }).click();
  }

  async name() {
    return this.page.getByRole('heading', { level: 1 }).innerText();
  }

  /** A field of the profile, by its label: "CIF", "Alta"… */
  async field(label: string) {
    const profile = this.page.getByRole('region', { name: 'Datos de la asesoría' });
    const term = profile.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) });
    return term.locator('xpath=following-sibling::dd').innerText();
  }

  /** A KPI card, by its label: "Facturación", "Declaraciones"… */
  kpi(label: string) {
    return this.page
      .getByRole('region', { name: 'Indicadores' })
      .getByRole('article', { name: label, exact: true });
  }

  /** A card of the comparison with its specialty, by its label. */
  specialtyKpi(label: string) {
    return this.page
      .getByRole('region', { name: 'Frente a su especialidad' })
      .getByRole('article', { name: label, exact: true });
  }

  specialtyKpiChart(label: string) {
    return new LineChartObject(this.specialtyKpi(label).getByRole('img'));
  }

  /** The value of the average firm of its specialty in a card: "· su especialidad 25.000 €". */
  async specialtyValue(label: string) {
    const text = await this.specialtyKpi(label).innerText();
    const [, value = ''] = /su especialidad ([\d.,]+)/.exec(text) ?? [];
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  specialtyLegend() {
    return this.page
      .getByRole('region', { name: 'Frente a su especialidad' })
      .getByRole('list')
      .first();
  }

  kpiChart(label: string) {
    return new LineChartObject(this.kpi(label).getByRole('img'));
  }

  /** The number shown by a KPI: "16.608 €" is 16608. */
  async kpiNumber(label: string) {
    const value = await this.kpi(label).getByRole('paragraph').first().innerText();
    return Number(value.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  kpiLabels() {
    return this.page.getByRole('region', { name: 'Indicadores' }).getByRole('article');
  }

  /** An alert of the firm, which only shows when something goes wrong. */
  alert(label: string) {
    return this.page
      .getByRole('list', { name: 'Alertas' })
      .getByRole('listitem')
      .filter({ hasText: label });
  }

  async compareWith(label: string) {
    await this.page.getByRole('button', { name: /Comparar con/ }).click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  /** The row of a metric in the comparison with six months before: its cells, in order. */
  async sixMonthsAgo(label: string) {
    const panel = this.page.getByRole('region', { name: 'Hace seis meses' });
    const table = panel.getByRole('grid');
    const header = await table.getByRole('columnheader').allInnerTexts();
    const row = table.getByRole('row').filter({
      has: this.page.getByRole('rowheader', { name: label, exact: true }),
    });
    const cells = await row.getByRole('gridcell').allInnerTexts();
    return { months: header.slice(1, 3), cells };
  }
}

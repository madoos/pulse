import { expect, type Page } from '@playwright/test';
import { GroupPanel } from './GroupPanel';
import { LineChartObject } from './LineChartObject';
import { NeedsAttentionPanel } from './NeedsAttentionPanel';
import { StandoutsPanel } from './StandoutsPanel';

/** The labels of the KPI cards, in the order they are shown. */
export const KPIS = ['Clientes activos', 'Facturación', 'Facturación por cliente', 'Bajas al mes'];

/** The network overview, the home page. */
export class NetworkOverviewPage {
  readonly needsAttention: NeedsAttentionPanel;
  readonly standouts: StandoutsPanel;
  readonly groups: GroupPanel;

  constructor(private readonly page: Page) {
    this.needsAttention = new NeedsAttentionPanel(page);
    this.standouts = new StandoutsPanel(page);
    this.groups = new GroupPanel(page);
  }

  async open() {
    await this.page.goto('/');
    await this.expectShown();
  }

  async expectShown() {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Vista de red' })).toBeVisible();
    await expect(this.kpi('Facturación')).toBeVisible();
  }

  async selectYear(label: string) {
    await this.choose('Año fiscal', label);
  }

  async compareWith(label: string) {
    await this.choose('Comparar con', label);
  }

  async groupBy(label: string) {
    await this.choose('Agrupar por', label);
  }

  /** Filters the months, given by their Spanish names: "abril". */
  async filterMonths(from: string, to: string) {
    await this.choose('Desde', from);
    await this.choose('Hasta', to);
  }

  /** The value shown by a filter: "2025-26", "Ninguno"… */
  async selected(filter: string) {
    return (await this.filter(filter).innerText()).replace('▾', '').trim();
  }

  /** Opens a filter and returns its options, leaving it open. */
  async openFilter(filter: string) {
    await this.filter(filter).click();
    const listbox = this.page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    return {
      options: (await listbox.getByRole('option').allInnerTexts()).map((o) => o.trim()),
      multiple: (await listbox.getAttribute('aria-multiselectable')) === 'true',
    };
  }

  async closeFilter() {
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('listbox')).toBeHidden();
  }

  /** What the filters show, in words. */
  summary() {
    return this.page.getByText(/^Estás viendo/);
  }

  /** A KPI card, by its label: "Facturación", "Bajas al mes"… */
  kpi(label: string) {
    return this.page.getByRole('article', { name: label, exact: true });
  }

  kpiChart(label: string) {
    return new LineChartObject(this.kpi(label).getByRole('img'));
  }

  /** The number shown by a KPI: "16.608.611 €" is 16608611. */
  async kpiNumber(label: string) {
    const value = await this.kpi(label).getByRole('paragraph').first().innerText();
    return Number(value.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  /** The titles of the panels, from top to bottom. */
  async panelTitles() {
    const titles = await this.page
      .getByRole('main')
      .getByRole('heading', { level: 2 })
      .allInnerTexts();
    // A collapsible panel draws an arrow before its title.
    return titles.map((title) => title.replace('›', '').trim());
  }

  private filter(name: string) {
    return this.page.getByRole('button', { name: new RegExp(name) });
  }

  private async choose(filter: string, option: string) {
    await this.filter(filter).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await expect(this.filter(filter)).toContainText(option);
  }
}

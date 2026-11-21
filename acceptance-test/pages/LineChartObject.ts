import type { Locator } from '@playwright/test';

/** A line chart of the design system, found inside a card or a panel. */
export class LineChartObject {
  constructor(private readonly root: Locator) {}

  /** The series drawn, by name: "2025-26", "Fiscal"… */
  async series(): Promise<string[]> {
    const lines = this.root.locator('[data-series]');
    const names = await lines.evaluateAll((paths) =>
      paths.map((path) => path.getAttribute('data-series') ?? ''),
    );
    return names.toSorted();
  }

  /** The labels of the horizontal axis: the months. */
  async months(): Promise<string[]> {
    return this.root.locator('.visx-axis-bottom text').allTextContents();
  }

  /** The labels of the vertical axis: the scale. */
  async scale(): Promise<string[]> {
    return this.root.locator('.visx-axis-left text').allTextContents();
  }
}

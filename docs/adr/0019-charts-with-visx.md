# ADR-0019: Charts built with visx

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Architecture

## Context

The design system includes the charts, wrapping a charting library and taking their colours from the tokens ([ADR-0007](0007-design-system-react-aria-tokens.md)). That ADR does not say which library.

The views need a small set of charts, always over months:

- Line charts with one or more series: one per fiscal year when two years are compared, or one per group when the network is grouped. The selected year has to stand out from the compared one.
- Gaps instead of zeros when a month has no data.
- A tooltip per month, and an accessible text alternative for screen readers.
- Sparklines inside the KPI cards.

Every colour, font and spacing has to come from the design tokens, so the charts change with the theme like any other component.

## Decision

**Charts are built with [visx](https://airbnb.io/visx/)**, using only the packages they need: scales, shapes, axes, grid, group and event helpers.

- visx gives low-level primitives (scales, line paths, axes) on top of d3, rendered as plain React SVG. It draws no chart on its own and ships no styles.
- The design system wraps them in its own components (`LineChart`, `Sparkline`). Applications import only those, never visx, so the library can be replaced without touching application code.
- Lines, axes and labels are styled with CSS custom properties: series colours are semantic tokens (`--color-chart-1`…), so a theme change reaches the charts.
- Missing months are gaps, through the `defined` accessor of the line path.
- Each chart has a text alternative (`role="img"` with a label), and its data is also available as a table in the views that need it.

## Alternatives considered

- **Recharts:** complete charts with little code, but they come with their own look. Colours, fonts, the tooltip and the legend are configured through props and its own components, which fight the tokens instead of using them.
- **Chart.js:** draws on a canvas, so it cannot be styled with CSS or tested in the DOM, and its accessibility has to be added by hand.
- **ECharts / Highcharts:** very complete and heavy, with their own theming systems. Highcharts also needs a commercial licence.
- **Hand-written SVG without a library:** enough for a sparkline, but scales, nice ticks and axes would be reimplemented and maintained in the design system.

## Consequences

### Positive

- Charts look like the rest of the design system and follow the theme, because they are styled with the same tokens.
- Only the primitives in use are bundled.
- The SVG is in the DOM, so charts are tested with React Testing Library like any other component.

### Negative

- More code per chart than a library with ready-made charts: the tooltip, the legend and the layout are written in the design system.
- visx releases are less frequent than those of the most popular chart libraries.

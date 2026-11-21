# ADR-0017: Metrics are analysed by fiscal year, from April to March

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Data

## Context

The network overview answers whether the network is getting better or worse by comparing one year with another. The metrics have strong seasonality: the income tax campaign raises activity and revenue from April to June, the summer brings them down, and the year-end closing and quarterly VAT raise them again from January to March.

Because of that seasonality, two periods can only be compared fairly if they contain the same months. Comparing June with July, or a whole year with nine months of another, shows changes that are only the season.

The data available starts in April and ends in March: one real year from April 2025 to March 2026, plus two earlier years generated with the same shape, from April 2023 to March 2025. In total, 36 consecutive months.

The business has no "year" of its own for these metrics: the data is monthly, and the year is defined by the application.

## Decision

**The application analyses and compares the metrics by fiscal year, from April to March.**

The only reason is that the data starts in April: cutting the years from April to March is what gives complete, comparable years. It is not the tax year (which in Spain is the calendar year) nor a way of working of the business. If the data started in January, the application would use the calendar year.

- A fiscal year is named by the two calendar years it spans: **"2025-26"** runs from April 2025 to March 2026.
- It is stored as the year in which it starts (`2025`), calculated from the month: the year of the month minus three months.
- **Years are always compared month by month**: April with April, May with May. When the user selects a range of months, the compared year uses the same months.
- Charts that show a year run **from April to March** on their horizontal axis.
- The available fiscal years come from the data. A new fiscal year appears when its first month (April) is loaded.

## Alternatives considered

- **Calendar year (January to December):** the most familiar for users, and the usual tax year in Spain. With the data available it gives two incomplete years (2023 with nine months and 2026 with three) next to two complete ones. Comparing an incomplete year with a complete one says nothing about growth, and the most recent year (the one users care about most) would be the shortest.
- **Rolling twelve months (the last twelve months against the twelve before):** always complete and always current, but its periods have no name, they move every month, and they are harder to select and to talk about.
- **No years, only a free date range:** maximum flexibility, but the user has to build fair comparisons by hand, and a careless range would mix seasons.

## Consequences

### Positive

- With the current data there are three complete fiscal years, so every comparison is between twelve months and twelve months.
- Comparing month by month removes the effect of seasonality: a drop in summer is not shown as a decline.
- The fiscal year is calculated from the month, so it never has to be loaded or kept in sync.

### Negative

- Users who think in calendar years have to get used to "2025-26". The label and the April to March axis make it explicit.
- A fiscal year in progress is incomplete until March. It is still compared fairly, because the compared year uses the same months.
- Changing the start month later means changing the generated column and the labels: one migration and the views that show years.

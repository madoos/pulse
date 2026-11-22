# ADR-0022: The detail of an advisory firm is measured as the network is, and against the rest of its specialty

- **Status:** Accepted
- **Date:** 2026-11-22
- **Category:** Data

## Context

The brief asks what the detail of an advisory firm has to answer: its profile and, above all, how it does over time. Is it growing in clients? Does it bill more or less than six months ago? Does it file many tax returns?

The network overview already measures the whole network with four metrics (active clients, revenue, revenue per client and churn), the same filters (fiscal year, months and a compared year, [ADR-0017](0017-fiscal-year-from-april-to-march.md)) and a set of alerts. A firm looked at on its own raises two problems that the network does not have:

- **Seasonality.** The work of an advisory firm follows the tax calendar. Across the network, revenue in March is 17 % higher than in September, and tax filings 28 % higher, of the same year. "Six months ago" always compares two different seasons, so almost every firm would look like it is growing, or shrinking, because of the calendar alone.
- **No reference.** A number for one firm, such as 1,817 € per client, says little without knowing what is usual for a firm like it.

The data has three fiscal years per firm and the employees of each firm only as they are today, with no history ([ADR-0016](0016-data-model-for-advisory-firms-and-monthly-metrics.md)).

## Decision

### The same metrics and filters as the network

- A firm is measured with **the same four metrics as the network**, computed by the same rules, plus **tax filings** (the brief asks about them), **incidents with the tax agency** and **revenue per employee**.
- The detail has **the same period and compared-year filters**, kept in the URL. It has no grouping, as a single firm has nothing to group.
- **Revenue per employee** divides by the employees of today, because there is no history of the staff. The card says so.
- **Incidents with the tax agency** are shown as a **rate over tax filings**: out of every 100 filings, how many end in an incident. The raw count grows with the size of the firm and with the tax campaigns, so only a rate compares a firm with another year and with its specialty. It is only shown in the detail.

### Alerts by the rules of the network

- The detail shows **the same alerts as the network overview**, computed by the same domain code against the whole network. A firm can never have one alert in its detail and another in the list of firms that need attention.
- Alerts always compare with **the same months of the previous fiscal year**, whatever year is chosen to compare with. That is how they avoid seasonality, and how the network computes them.

### Against the average firm of the rest of its specialty

- The detail sets the firm against **the average firm of the other firms of its specialty**, in the selected period: each month, the totals of the other firms over how many of them had data that month.
- **The firm is left out of its own average**, so it is never compared with itself. This matters most in small specialties.
- It is **the average firm, not the total** of the specialty, so both lines share a scale.
- Firms of the same specialty share their seasonality. **The gap between the two lines is the firm's own doing**, not the calendar's.
- The comparison uses the period, not the compared year. That comparison is already shown by the metrics, and both together would draw four lines per chart.

### Six months ago, corrected by its specialty

- The last month of the period with data is compared with six months before it, as the brief asks.
- Next to the change of the firm, the detail shows **the change of the average firm of its specialty in the same two months**, and the **difference in points** between them, in green or red. A firm that bills 20 % more while its specialty bills 25 % more is doing worse, not better.

## Alternatives considered

- **Comparing with the whole network:** simpler, but firms of different specialties do not share their seasonality. A labour firm barely notices the income tax campaign.
- **Comparing with the total of the specialty:** the lines would not share a scale, and a large specialty would flatten the firm into a straight line.
- **Seasonal indexes:** weighting each month by its share of the year and comparing adjusted values. It is the textbook answer and gives a single clean number, but it is hard to explain to the user, and with three years of data the indexes are not reliable.
- **Comparing with the same month of the previous year:** removes seasonality without tricks, and is what the metrics and the alerts already do, but it stops answering "six months ago", which is what the brief asks.
- **Leaving the firm inside its specialty average:** one query less, but the firm would partly compare with itself.

## Consequences

### Positive

- The detail answers the questions of the brief with the same vocabulary as the network overview, so the user learns the metrics once.
- Seasonality does not make a firm look better or worse than it is: the alerts compare with the same months of the previous year, and the six-months comparison is read against its specialty.
- The rules of the metrics and the alerts live once in the domain of the backend, shared by the network and the detail.

### Negative

- The detail asks the database for more: the months of the firm, those of its specialty, and the periods of the whole network for the alerts. With the read indexes it answers in well under a second, but it is several queries per change of filters.
- The average firm of a specialty has fractional values, such as 156.4 active clients, so the contract has its own schemas for it.
- Revenue per employee in past years uses the employees of today, so it is only an approximation until there is a history of the staff.
- A firm has a handful of incidents a month, so the monthly incident rate jumps from one month to the next; the value of the period is the reliable one.
- A firm that is the only one of its specialty has nothing to compare with, and the detail says so.

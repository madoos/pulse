# Use cases: UC-07 (aggregated network overview), UC-08 (navigation)
#
# Question this view answers: is the network getting better or worse?
#
# Years:
#   - A year is a fiscal year from April to March, labelled "2025-26"
#   - The available years come from the data: every fiscal year with metrics
#   - Years are always compared month by month (April with April), so seasonality
#     never looks like growth or decline
#
# Chosen metrics (decision to defend):
#   - Active clients      -> the engine of the business: is the network growing?
#   - Revenue             -> the result of the business
#   - Revenue per client  -> are we growing in value or only in volume?
#   - Churn               -> the risk signal: the share of clients that leave in a month.
#                            The UI calls it "Bajas al mes" (monthly churn rate)
#   Tax filings, satisfaction and the revenue mix belong to the advisory firm detail.
#   Hours, queries, documents and tax agency incidents are left out: they follow
#   active clients and add no signal of their own.
#
# Aggregation rules:
#   - Active clients, revenue and churned clients -> SUM across advisory firms
#   - Active clients of a period -> those of its last month
#   - Revenue per client of a month -> revenue / active clients of that month
#   - Revenue per client of a period -> revenue of the period / average monthly active clients
#   - Churn of a period -> churned clients / sum of monthly active clients (mean monthly churn)
#   - Change -> selected period vs the same months of the compared year

@network
Feature: Network overview
  As an Asevia internal user
  I want to see the network as a whole and compare it with other years
  So that I know whether the network overall is getting better or worse

  Background:
    Given there are advisory firms with metrics for the fiscal years 2023-24, 2024-25 and 2025-26
    And I am on the network overview

  # ---------- Filters ----------

  @UC-07
  Scenario: The available years come from the data
    Then the year selector offers 2023-24, 2024-25 and 2025-26
    And 2025-26 is selected by default

  @UC-07
  Scenario: A new fiscal year appears when its data arrives
    Given metrics arrive for April 2026
    Then the year selector also offers 2026-27

  @UC-07
  Scenario: No comparison by default
    Then no year is selected to compare with
    And the KPIs and charts only show 2025-26

  @UC-07
  Scenario: Compare with one other year at most
    When I open the "Compare with" selector
    Then it offers "None", 2024-25 and 2023-24
    And it does not offer the selected year
    And I can only pick one of them

  @UC-07
  Scenario: Changing the selected year resets an invalid comparison
    Given 2025-26 is compared with 2024-25
    When I select 2024-25 as the year
    Then no year is selected to compare with

  @UC-07
  Scenario: The view says in words what it shows
    Given 2025-26 is compared with 2024-25
    When I filter the months from January to March
    Then I read "Estás viendo de enero a marzo 2025-26 frente a los mismos meses de 2024-25."

  @UC-07
  Scenario: Each KPI shows one line per year
    Given 2025-26 is compared with 2024-25
    Then the small chart of each KPI shows one line for 2025-26 and another for 2024-25
    And it has a vertical scale and the months of the period below

  @UC-07
  Scenario: Filter by months
    When I filter the months from April to June
    Then the KPIs and charts only use April, May and June of the selected year
    And the compared year uses the same months

  @UC-07
  Scenario: The month range must be valid
    When I filter the months from June to April
    Then I cannot apply the filter

  # ---------- Aggregated KPIs ----------

  @UC-07
  Scenario: See the network KPIs for the selected period
    Then I see these KPIs for the selected period:
      | kpi                   |
      | active clients        |
      | revenue               |
      | revenue per client    |
      | mean monthly churn    |
    And each KPI shows a small chart of its monthly values

  @UC-07
  Scenario: Totals are the sum of all advisory firms
    Given in March 2026 the advisory firms have:
      | advisory firm | active clients | revenue |
      | A             | 100            | 10000   |
      | B             | 300            | 25000   |
    And I filter the months from March to March
    Then the network's active clients are 400
    And the network's revenue is "35.000 €"

  @UC-07
  Scenario: Active clients of a period are those of its last month
    Given the network has 7000 active clients in April 2025 and 8000 in March 2026
    Then the network's active clients for 2025-26 are 8000

  @UC-07
  Scenario: Revenue per client and churn of a period
    Given the network has these months in the selected period:
      | month   | active clients | churned clients | revenue |
      | 2025-04 | 1000           | 10              | 200000  |
      | 2025-05 | 1000           | 30              | 220000  |
    Then the network's revenue per client is "420 €"
    And the network's mean monthly churn is "2,0 %"

  @UC-07
  Scenario: An advisory firm without data for a month does not break the aggregate
    Given an advisory firm has no metrics for one month
    Then that month's aggregate is calculated with the advisory firms that do have data
    And it shows how many advisory firms contributed data that month

  @UC-07
  Scenario: KPIs show the change against the compared year
    Given 2025-26 is compared with 2024-25
    And the network's revenue is 16.600.000 € in 2025-26 and 13.700.000 € in 2024-25
    Then the revenue KPI shows "▲ +21,2 % · antes 13.700.000 €"

  @UC-07
  Scenario Outline: The colour of a change says whether it is good or bad
    Given 2025-26 is compared with 2024-25
    When the <kpi> goes <direction>
    Then its change is shown as <meaning>

    Examples:
      | kpi                | direction | meaning |
      | active clients     | up        | good    |
      | revenue            | up        | good    |
      | revenue per client | down      | bad     |
      | mean monthly churn | down      | good    |
      | mean monthly churn | up        | bad     |

  # ---------- Monthly charts ----------

  @UC-07
  Scenario: Monthly network charts
    Then I see monthly charts of:
      | metric             |
      | revenue            |
      | active clients     |
      | revenue per client |
    And their horizontal axis goes from April to March

  @UC-07
  Scenario: Compared years are overlaid in the same chart
    Given 2025-26 is compared with 2024-25
    Then each chart shows one line per year over the same months
    And the line of the selected year stands out from the compared one

  @UC-07
  Scenario: Each year keeps its colour across the whole view
    Given 2025-26 is compared with 2024-25
    Then 2024-25 has the same colour in every chart and in the legend

  # ---------- Grouping ----------

  @UC-07
  Scenario: Group by specialty or autonomous community
    When I open the "Group by" selector
    Then it offers "None", "Specialty" and "Autonomous community"

  @UC-07
  Scenario: The groups come from the data
    When I group by autonomous community
    Then I only see the autonomous communities that have advisory firms

  @UC-07
  Scenario: Grouped charts show one line per group
    Given 2025-26 is compared with 2024-25
    When I group by specialty
    Then each chart shows one line per specialty for 2025-26 only
    And the KPIs still show the whole network

  @UC-07
  Scenario: Group table
    When I group by specialty
    Then I see a table with one row per specialty and these columns:
      | column                       |
      | number of advisory firms     |
      | revenue                      |
      | revenue per advisory firm    |
      | revenue per client           |
      | mean monthly churn           |
    And I can sort the table by any column

  @UC-07
  Scenario: The group table shows the change against the compared year
    Given 2025-26 is compared with 2024-25
    When I group by specialty
    Then the group table also shows each group's revenue change vs 2024-25

  @UC-07
  Scenario: Revenue per advisory firm tells apart size and performance
    Given in the selected period:
      | specialty | advisory firms | revenue |
      | Fiscal    | 24             | 7860000 |
      | Laboral   | 10             | 4100000 |
    When I group by specialty and sort by revenue per advisory firm
    Then Laboral comes before Fiscal

  # ---------- Advisory firms that stand out ----------

  @UC-07
  Scenario: Advisory firms that stand out
    Then I see the 5 advisory firms with the highest active client growth
    And each one shows its client growth and its mean monthly churn
    And the ones that also need attention are marked

  @UC-07
  Scenario: Growth of an advisory firm is measured against the previous year
    Given 2025-26 is selected and no year is compared
    Then the growth of each advisory firm compares its active clients at the end of the period with the same month of 2024-25

  @UC-07
  Scenario: Advisory firms without data in the previous year are left out of the ranking
    Given an advisory firm has no metrics in 2024-25
    Then it does not appear among the advisory firms that stand out

  @UC-07
  Scenario: The first year has nothing to compare with
    When I select 2023-24 as the year
    Then the "Compare with" selector only offers "None", 2024-25 and 2025-26
    And the advisory firms that stand out show that there is no previous year to compare with

  # ---------- Advisory firms that need attention ----------
  #
  # Question this section answers: what is going wrong, and where?
  # Every rule compares the selected period with the same months of the previous
  # fiscal year, so seasonality never raises an alert. Thresholds are relative to
  # the network or to the firm itself, so they do not go stale.
  #
  #   - Losing clients      -> fewer active clients at the end of the period than in the
  #                            same month of the previous year
  #   - High churn          -> mean monthly churn of 1.5 times the network's or more
  #   - Falling revenue     -> less revenue than in the same months of the previous year
  #   - Losing value        -> revenue per client 10 % or more below the same months of
  #                            the previous year
  #   - Missing data        -> no metrics for the last month of the period

  @UC-07
  Scenario Outline: Detect an advisory firm that needs attention
    Given 2025-26 is selected
    And an advisory firm <situation>
    Then it appears among the advisory firms that need attention with the alert "<alert>"

    Examples:
      | situation                                                           | alert           |
      | has 238 active clients in March 2026 and had 248 in March 2025      | Losing clients  |
      | has a mean monthly churn of 3,0 % while the network has 1,6 %       | High churn      |
      | bills 300.000 € in 2025-26 and billed 320.000 € in 2024-25          | Falling revenue |
      | bills 1.800 € per client in 2025-26 and billed 2.100 € in 2024-25   | Losing value    |
      | has no metrics for March 2026                                       | Missing data    |

  @UC-07
  Scenario: An advisory firm that is doing well needs no attention
    Given 2025-26 is selected
    And an advisory firm grows in clients, revenue and revenue per client with a churn below 1.5 times the network's
    Then it does not appear among the advisory firms that need attention

  @UC-07
  Scenario: Each advisory firm shows all its alerts
    Given an advisory firm is losing clients and has a high churn
    Then it appears once with both alerts
    And each alert shows its value and the reference it is compared with

  @UC-07
  Scenario: The ones with more alerts come first
    Given one advisory firm has two alerts and another one has one
    Then the advisory firm with two alerts comes first

  @UC-07
  Scenario: Filter by type of alert
    When I filter the advisory firms that need attention by "High churn"
    Then I only see the advisory firms with a high churn
    And each filter shows how many advisory firms have that alert

  @UC-07
  Scenario: The alerts follow the selected months
    When I filter the months from April to June
    Then the alerts compare April to June with April to June of the previous year

  @UC-07
  Scenario: The first year only has the alerts that need no previous year
    When I select 2023-24 as the year
    Then the advisory firms that need attention only show the alerts "High churn" and "Missing data"

  @UC-07
  Scenario: Nothing needs attention
    Given no advisory firm has any alert
    Then I see a message saying that no advisory firm needs attention

  # ---------- UC-08 · Navigation ----------

  @UC-08
  Scenario: Go to an advisory firm from the ones that stand out
    When I click on an advisory firm among the ones that stand out
    Then the detail page of that advisory firm opens

  @UC-08
  Scenario: Go to an advisory firm that needs attention
    When I click on an advisory firm among the ones that need attention
    Then the detail page of that advisory firm opens

  @UC-08
  Scenario: Global navigation
    Then from the menu I can go to the listing and to the network overview from any screen

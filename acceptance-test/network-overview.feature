# Use cases: UC-07 (aggregated network overview), UC-08 (navigation)
#
# Aggregation rules:
#   - Clients, revenue and tax filings -> SUM across all advisory firms
#   - Satisfaction -> AVERAGE WEIGHTED by active clients (not a simple average)
#   - Change % -> same formula as in the detail page (latest month vs 6 months ago)

@network
Feature: Network overview
  As an Asevia internal user
  I want to see the network as a whole, with metrics aggregated by month and their trend
  So that I know whether the network overall is getting better or worse

  Background:
    Given there are 50 advisory firms with 12 months of metrics
    And I am on the network overview

  # ---------- Aggregated KPIs ----------

  @UC-07
  Scenario: See the network KPIs for the latest month
    Then I see the network KPIs for the latest available month:
      | kpi                      |
      | number of advisory firms |
      | total active clients     |
      | total revenue            |
      | total tax filings        |
      | average satisfaction     |
    And each KPI shows its change compared with six months ago

  @UC-07
  Scenario: Totals are the sum of all advisory firms
    Given in the latest month the advisory firms have:
      | advisory firm | active clients | revenue |
      | A             | 100            | 10000   |
      | B             | 300            | 25000   |
    Then the network's active clients are 400
    And the network's revenue is "35.000 €"

  @UC-07
  Scenario: Network satisfaction is weighted by clients
    Given in the latest month the advisory firms have:
      | advisory firm | active clients | satisfaction |
      | A             | 100            | 5            |
      | B             | 300            | 3            |
    Then the network's average satisfaction is 3,5

  @UC-07
  Scenario: An advisory firm without data for a month does not break the aggregate
    Given an advisory firm has no metrics for one month
    Then that month's aggregate is calculated with the advisory firms that do have data
    And it shows how many advisory firms contributed data that month

  # ---------- Monthly trend ----------

  @UC-07
  Scenario: Monthly network trend
    Then I see 12-month charts, in chronological order, of:
      | metric               |
      | total active clients |
      | total revenue        |
      | total tax filings    |
      | average satisfaction |

  @UC-07
  Scenario: Network new and churned clients
    Then I see the network's total new and churned clients per month
    And I see the net client growth (new minus churned)

  @UC-07
  Scenario: Network seasonality is visible
    Then the tax filings chart shows the peak of the income tax campaign
    And it shows the summer dip

  @UC-07
  Scenario: Overall trend indicator
    Then I can see at a glance whether the network is getting better or worse
    Because each KPI shows an up, down or flat indicator compared with six months ago

  # ---------- Breakdown and ranking (optional) ----------

  @UC-07 @optional
  Scenario: Breakdown by province
    Then I see the latest month's revenue and clients grouped by province

  @UC-07 @optional
  Scenario: Breakdown by specialty
    Then I see the latest month's revenue and clients grouped by specialty

  @UC-07 @optional
  Scenario: Advisory firm ranking by growth
    Then I see the 5 advisory firms with the highest revenue growth compared with six months ago
    And I see the 5 advisory firms with the largest decline

  # ---------- UC-08 · Navigation ----------

  @UC-08
  Scenario: Go to an advisory firm from the ranking
    When I click on an advisory firm in the ranking
    Then the detail page of that advisory firm opens

  @UC-08
  Scenario: Global navigation
    Then from the menu I can go to the listing and to the network overview from any screen

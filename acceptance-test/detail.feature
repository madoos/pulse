# Use cases: UC-04 (profile), UC-05 (monthly trend), UC-06 (comparison with 6 months ago), UC-08 (navigation)
#
# Chosen metrics (decision to defend):
#   - Clients: active + new and churned       -> "Is it growing in clients?"
#   - Revenue: total and breakdown by line    -> "Does it bill more or less than six months ago?"
#   - Tax filings: by type                    -> "Does it file many tax returns?"
#   - Client satisfaction (1-5)               -> quality counterweight
#   - Revenue per client (derived)            -> normalizes by size

@detail
Feature: Advisory firm detail
  As an Asevia internal user
  I want to open an advisory firm and see its profile and how it evolves month by month
  So that I know whether it is growing in clients, billing more or less, and how many tax filings it handles

  Background:
    Given there is an advisory firm with 12 months of metrics
    And I am on its detail page

  # ---------- UC-04 · Profile ----------

  @UC-04
  Scenario: See the advisory firm's basic data
    Then I see:
      | field           |
      | name            |
      | tax ID (CIF)    |
      | province        |
      | city            |
      | onboarding date |
      | employees       |
      | specialty       |

  @UC-04
  Scenario: See the KPIs for the latest month
    Then I see the KPIs for the latest available month:
      | kpi                 |
      | active clients      |
      | total revenue       |
      | total tax filings   |
      | client satisfaction |
    And it shows which month they refer to

  @UC-04 @error
  Scenario: Advisory firm does not exist
    When I open the detail page of an advisory firm with an id that does not exist
    Then I see the message "Advisory firm not found"
    And I see a link back to the listing

  # ---------- UC-05 · Monthly trend ----------

  @UC-05
  Scenario: Client trend
    Then I see a chart of active clients with 12 months in chronological order
    And I see new and churned clients for each month

  @UC-05
  Scenario: Revenue trend
    Then I see the total revenue for each month
    And I see its breakdown into advisory, management and consulting

  @UC-05
  Scenario: Total revenue is the sum of its lines
    Given in one month the advisory firm bills:
      | line        | amount |
      | advisory    | 5000   |
      | management  | 3000   |
      | consulting  | 2000   |
    Then the total revenue for that month is "10.000 €"

  @UC-05
  Scenario: Tax filing trend by type
    Then I see each month's tax filings broken down into income tax (IRPF), VAT, corporate tax and other

  @UC-05
  Scenario: Seasonality is visible
    Then during the income tax campaign months the income tax filings are higher than in the rest of the months

  @UC-05
  Scenario: Satisfaction trend
    Then I see the average satisfaction for each month on a scale from 1 to 5

  @UC-05
  Scenario: Revenue per client
    Given in one month the advisory firm bills 10.000 € and has 200 active clients
    Then the revenue per client for that month is "50 €"

  @UC-05
  Scenario: Table with month-by-month values
    Then I see a table with the value of each displayed metric for each of the 12 months
    And amounts are shown in euros with Spanish formatting, for example "12.345 €"

  @UC-05
  Scenario: Month without data
    Given the advisory firm is missing one month of metrics
    Then that month appears as a gap in the chart and not as zero
    And in the table it appears as "—"

  # ---------- UC-06 · Comparison with six months ago ----------
  # Formula: change % = (latest month value - value 6 months ago) / value 6 months ago × 100

  @UC-06
  Scenario Outline: Change compared with six months ago
    Given the advisory firm's <metric> six months ago was <before>
    And in the latest month it is <now>
    Then I see the <metric> change "<change>" with a "<trend>" indicator

    Examples:
      | metric         | before | now   | change  | trend |
      | revenue        | 10000  | 12000 | +20,0 % | up    |
      | active clients | 200    | 180   | -10,0 % | down  |
      | tax filings    | 50     | 50    | 0,0 %   | flat  |

  @UC-06
  Scenario: No reference value
    Given the advisory firm has no data from six months ago
    Then the change is shown as "n/a"

  @UC-06
  Scenario: Reference value equal to zero
    Given the advisory firm had 0 corporate tax filings six months ago
    And it has 5 in the latest month
    Then the change is shown as "n/a" and no error occurs

  # ---------- UC-08 · Navigation ----------

  @UC-08 @e2e
  Scenario: Direct access by URL
    When I open the advisory firm's detail page URL directly
    Then I see its detail page without going through the listing

  @UC-08
  Scenario: Go back to where the detail was opened from
    Given I opened the detail from the advisory firm listing
    When I click "Volver"
    Then I return to the page I was on, with the listing open and its filters

  @UC-08 @e2e
  Scenario: Go back after opening the URL directly
    Given I opened the detail page URL directly
    When I click "Volver"
    Then I go to the network overview

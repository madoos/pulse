# Use cases: UC-04 (profile), UC-05 (monthly trend), UC-06 (comparison with six months ago), UC-08 (navigation)
#
# What the brief asks for: "when I click an advisory firm I want to see its profile and, above
# all, how it does over time. Is it growing in clients? Does it bill more or less than six
# months ago? Does it file many tax returns?"
#
# Chosen metrics (decision to defend, ADR-0022): the firm is measured as the network is
# (active clients, revenue, revenue per client, churn), with the same filters, plus:
#   - Active clients        -> "Is it growing in clients?"
#   - Revenue               -> "Does it bill more or less than six months ago?"
#   - Tax filings           -> "Does it file many tax returns?"
#   - Incidents             -> how often filing goes wrong: incidents with the tax agency over
#                              filings, a rate so firms of any size compare
#   - Revenue per employee  -> how much each person bills, with the staff of today
#   - Alerts                -> what goes wrong, by the same rules as the network
#   - Its specialty         -> the average firm of the rest of its specialty, which shares its
#                              seasonality, so "six months ago" is not fooled by the calendar

@detail
Feature: Advisory firm detail
  As an Asevia internal user
  I want to open an advisory firm and see its profile and how it evolves month by month
  So that I know whether it is growing in clients, billing more or less, how many tax filings it handles and how well,
  what goes wrong, and how it does against the rest of its specialty, which shares its seasonality

  Background:
    Given there is an advisory firm with monthly metrics
    And I am on its detail page

  # ---------- UC-04 · Profile ----------

  @UC-04 @e2e
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

  # ---------- UC-05 · Monthly trend ----------

  @UC-05 @e2e
  Scenario: Is it growing in clients?
    Then I see its active clients month by month over the latest fiscal year

  @UC-05 @e2e
  Scenario: Does it file many tax returns?
    Then I see its tax filings month by month over the latest fiscal year

  @UC-05 @e2e
  Scenario: Does it have problems filing tax returns?
    Then I see how many of every 100 tax filings end in an incident with the tax agency

  # ---------- UC-06 · Comparison with six months ago ----------

  @UC-06 @e2e
  Scenario: Does it bill more or less than six months ago?
    Then I see its revenue month by month over the latest fiscal year
    And I see the revenue of the latest month compared with the month six months before
    And I see how its specialty's revenue changed in those same two months, and the difference in points

  @UC-06 @e2e
  Scenario: Compare with the rest of its specialty, which shares its seasonality
    Then I see it against the average firm of the rest of its specialty
    And the revenue of that average firm is the revenue of the other firms of its specialty over how many there are, month by month

  @UC-05 @e2e
  Scenario: How much each employee bills
    Then I see its revenue per employee: the revenue of the period over its employees

  @UC-05 @e2e
  Scenario: See in red what goes wrong
    When I open an advisory firm whose churn is at least 1.5 times the network's
    Then I see the alert "Muchas bajas" in red

  @UC-05 @e2e
  Scenario: Compare with another year
    When I compare with "2024-25"
    Then every chart has a line for "2025-26" and one for "2024-25"

  # ---------- UC-08 · Navigation ----------

  @UC-08 @e2e
  Scenario: Go back to the listing
    Given I opened the detail from the advisory firm listing
    When I click "Volver"
    Then I return to the listing with its search and filters

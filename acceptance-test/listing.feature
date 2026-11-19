# Use cases: UC-01 (view listing), UC-02 (search), UC-03 (filter), UC-08 (navigation from the listing)

@listing
Feature: Advisory firm listing
  As an Asevia internal user
  I want to see all advisory firms with their basic data and be able to search and filter them
  So that I know at a glance which advisory firms we have in the network

  Background:
    Given there are 50 advisory firms loaded in Pulse

  # ---------- UC-01 · View the listing ----------

  @UC-01
  Scenario: See all advisory firms when opening Pulse
    When I open Pulse
    Then I see the advisory firm listing
    And the counter shows "50 advisory firms"

  @UC-01
  Scenario: Each advisory firm shows its basic data
    When I open Pulse
    Then each row of the listing shows:
      | field     |
      | name      |
      | province  |
      | city      |
      | employees |
      | specialty |

  @UC-01
  Scenario: Sort the listing by number of employees
    Given I am on the listing
    When I sort by employees from highest to lowest
    Then the first advisory firm is the one with the most employees
    And the last advisory firm is the one with the fewest employees

  @UC-01
  Scenario: Sort the listing by name
    Given I am on the listing
    When I sort by name
    Then the advisory firms appear in alphabetical order

  @UC-01 @error
  Scenario: The API is unavailable
    Given the API does not respond
    When I open Pulse
    Then I see a message saying the advisory firms could not be loaded
    And I do not see a blank screen

  # ---------- UC-02 · Search ----------

  @UC-02
  Scenario: Search by part of the name, ignoring case and accents
    Given there is an advisory firm named "Asesoría Martínez y Asociados"
    When I search for "martinez"
    Then the listing includes "Asesoría Martínez y Asociados"
    And every advisory firm in the listing contains "martinez" in its name, city or tax ID

  @UC-02
  Scenario: Search by city
    Given there are advisory firms in the city "Málaga"
    When I search for "malaga"
    Then the listing only shows advisory firms whose name, city or tax ID contains "malaga"

  @UC-02
  Scenario: Search by tax ID (CIF)
    Given there is an advisory firm with tax ID "B12345678"
    When I search for "B12345678"
    Then the listing only shows that advisory firm

  @UC-02
  Scenario: Search with no results
    When I search for "zzzz-does-not-exist"
    Then I see the message "No advisory firms match"
    And the counter shows "0 advisory firms"

  @UC-02
  Scenario: Clear the search
    Given I have searched for "martinez"
    When I clear the search text
    Then I see all 50 advisory firms again

  # ---------- UC-03 · Filter ----------

  @UC-03
  Scenario: Filter options come from the data
    When I open the province filter
    Then I only see provinces that have at least one advisory firm
    And when I open the specialty filter I see "fiscal", "contable" and "laboral"

  @UC-03
  Scenario Outline: Filter by a single criterion
    When I filter by <filter> "<value>"
    Then every advisory firm in the listing has <filter> "<value>"
    And the counter shows the number of filtered advisory firms

    Examples:
      | filter    | value    |
      | province  | Madrid   |
      | province  | Valencia |
      | specialty | fiscal   |
      | specialty | contable |
      | specialty | laboral  |

  @UC-03
  Scenario: Filter by size (employee range)
    When I filter by employees between 5 and 15
    Then every advisory firm in the listing has between 5 and 15 employees

  @UC-03
  Scenario: Combine filters and search
    When I filter by province "Valencia"
    And I filter by specialty "fiscal"
    And I search for "gestión"
    Then every advisory firm in the listing meets all three conditions at once

  @UC-03
  Scenario: Filters with no results
    When I apply a combination of filters that no advisory firm meets
    Then I see the message "No advisory firms match"
    And I see the "Clear filters" option

  @UC-03
  Scenario: Clear filters
    Given I have filters applied
    When I click "Clear filters"
    Then I see all 50 advisory firms again

  @UC-03
  Scenario: Filters persist after reloading the page
    Given I have filtered by province "Sevilla"
    When I reload the page
    Then the province filter "Sevilla" is still applied
    And the listing still only shows advisory firms from "Sevilla"

  # ---------- UC-08 · Navigation ----------

  @UC-08
  Scenario: Go to an advisory firm's detail page
    Given I am on the listing
    When I click on an advisory firm
    Then the detail page of that advisory firm opens

  @UC-08
  Scenario: Return from the detail page keeping filters and search
    Given I have filtered by province "Madrid" and searched for "asesores"
    When I open an advisory firm and go back
    Then the listing is still filtered by "Madrid" with the search "asesores"

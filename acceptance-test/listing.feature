# Use cases: UC-01 (view listing), UC-02 (search), UC-03 (filter), UC-08 (navigation from the listing)
#
# What the brief asks for: "see the advisory firms: name, where they are, how many people
# they have, what they do (fiscal, contable, laboral). Search or filter by province,
# specialty… So that at a glance I know what we have."

@listing
Feature: Advisory firm listing
  As an Asevia internal user
  I want to see all advisory firms with their basic data and be able to search and filter them
  So that I know at a glance which advisory firms we have in the network

  # The listing is a drawer that opens over any page, from "Asesorías" in the sidebar.

  Background:
    Given there are 50 advisory firms loaded in Pulse

  # ---------- UC-01 · View the listing ----------

  @UC-01 @e2e
  Scenario: See all advisory firms
    When I open "Asesorías" in the sidebar
    Then I see the 50 advisory firms

  @UC-01 @e2e
  Scenario: Each advisory firm shows its basic data
    When I open the advisory firm listing
    Then each advisory firm shows:
      | field     |
      | name      |
      | province  |
      | city      |
      | employees |
      | specialty |

  # ---------- UC-02 · Search ----------

  @UC-02 @e2e
  Scenario: Search by name
    Given there is an advisory firm named "Gestoria Martínez & Asociados"
    And I am on the listing
    When I search for "martínez"
    Then the listing includes "Gestoria Martínez & Asociados"
    And every advisory firm in the listing contains "martínez" in its name

  # ---------- UC-03 · Filter ----------

  @UC-03 @e2e
  Scenario Outline: Filter by province or specialty
    Given I am on the listing
    When I filter by <filter> "<value>"
    Then every advisory firm in the listing has <filter> "<value>"

    Examples:
      | filter    | value  |
      | province  | Madrid |
      | specialty | Fiscal |

  # ---------- UC-08 · Navigation ----------

  @UC-08 @e2e
  Scenario: Go to an advisory firm's detail page
    Given I am on the listing
    When I click on an advisory firm
    Then the detail page of that advisory firm opens

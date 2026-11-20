# ADR-0007: Design system built on React Aria Components, CSS Modules and design tokens

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Architecture

## Context

The frontend is built from dumb, reusable components, most of which should come from a component catalogue ([ADR-0004](0004-frontend-react-redux-observable.md)). The company runs several products and iterates quickly, so a shared design system avoids re-deciding design, style and brand in every product and every iteration.

The design system has to be:

- **Accessible:** usable with keyboard and screen readers, with correct focus management, ARIA semantics and sufficient colour contrast.
- **Themeable:** the look and feel must be changeable later (brand updates, another product, dark mode) without rewriting components.
- **Responsive:** components must work on any screen size.
- **Visible:** the team must be able to browse and try every component in isolation.

Its initial look and feel follows the company's existing brand identity.

## Decision

### Accessible behaviour: React Aria Components

Components are built on **[React Aria Components](https://react-spectrum.adobe.com/react-aria/)**, an unstyled (headless) library.

- It provides the hard part of accessibility: keyboard interaction, focus management, ARIA roles and states, screen reader support, and internationalisation of numbers and dates.
- It ships no styles. Interactive states are exposed as data attributes (`data-hovered`, `data-pressed`, `data-focus-visible`, `data-selected`, `data-disabled`…), which are styled with tokens.
- It covers the components the application needs out of the box, including sortable tables, selects, comboboxes, sliders and date pickers.
- The design system wraps these primitives in its own components. Applications import only from the design system, never from React Aria directly, so the base library can be replaced without changing application code.

### Design tokens as CSS custom properties

All visual decisions are **design tokens**, implemented as **CSS custom properties**, in three tiers:

| Tier | Purpose | Example |
|---|---|---|
| **Primitive** | Raw values: the palette, type scale, spacing scale, radii, shadows, breakpoints | `--color-blue-700`, `--space-4` |
| **Semantic** | Meaning, mapped to primitives | `--color-action-primary`, `--color-surface`, `--color-text-on-accent` |
| **Component** | Specific decisions of one component, mapped to semantic tokens | `--button-primary-background` |

- Components use **only semantic or component tokens**, never raw values or primitives.
- Changing the look and feel (a brand update, another product, a dark theme) means changing primitives or the semantic mapping, not the components.
- Initial primitives come from the company's brand identity. Every text/background pair in the semantic tier must meet **WCAG 2.2 AA** contrast. Where the brand uses a combination that does not (for example white text on a light accent colour), the design system uses a compliant alternative instead.

### Styling: CSS Modules

Components are styled with **CSS Modules** that consume the tokens.

- Styles are scoped per component, with no runtime cost and no extra styling library.
- Interactive states are styled through React Aria's data attributes.

### Responsive

- **Mobile-first** styles, with breakpoints defined as tokens.
- **Container queries** inside components where it makes sense, so a component adapts to the space it is given, not only to the screen size.

### Catalogue: Storybook

**Storybook** is the component catalogue: every component has stories showing its variants and states, so the team can browse and try them in isolation.

- The **accessibility addon** (axe) checks every story.
- Components are tested with React Testing Library, including automated accessibility checks in CI.

### Scope and packaging

- The design system is a **separate workspace package with its own version**, so other products can depend on a specific version and see breaking changes explicitly.
- It contains **no business logic** and knows nothing about any application. Application-specific compositions live in the application.
- React is a peer dependency.
- Charts are design system components that wrap a charting library and take their colours from the tokens.

## Alternatives considered

- **Styled component libraries (MUI, Mantine, Chakra):** fast to start and reasonably accessible, but they come with their own visual language. Fully changing the look and feel means fighting their theming system.
- **Radix UI Primitives:** a strong headless alternative and very popular. React Aria Components was preferred for its stronger accessibility and internationalisation coverage and because it includes tables and date components.
- **shadcn/ui:** components copied into the repository (Radix + Tailwind). Flexible, but the copied code has to be maintained by hand, and it ties the styling to Tailwind.
- **Tailwind CSS:** works well with tokens, but spreads styling decisions across markup as utility classes. CSS Modules keep each component's styles in one place, consuming tokens directly.
- **CSS-in-JS (styled-components, Emotion):** adds runtime cost and a dependency for something CSS custom properties already solve.

## Consequences

### Positive

- Accessibility is built into every component from the base library, and checked automatically in Storybook and CI.
- The look and feel can be changed through tokens without touching components.
- Applications depend on the design system's API, not on React Aria, so the base library is replaceable.
- Styles have no runtime cost.
- Storybook gives the team, and other products, a living catalogue of what is available.

### Negative

- More initial work than an off-the-shelf styled library: every component has to be styled from scratch.
- React Aria's API is more verbose and less widely known than Radix's.
- Token tiers require discipline: a raw value in a component silently breaks theming. This is mitigated with lint rules on stylesheets.
- Storybook is one more tool to maintain and build in CI.

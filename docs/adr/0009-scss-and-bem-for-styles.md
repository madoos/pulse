# ADR-0009: Write styles in SCSS with BEM naming

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Conventions and code style

## Context

Components are styled with CSS Modules that consume design tokens implemented as CSS custom properties ([ADR-0007](0007-design-system-react-aria-tokens.md)). The same applies to the application's own components.

Plain CSS works, but as components grow:

- Every state, variant and child element repeats the component's selector, which makes stylesheets long and hard to scan.
- Class names inside a module have no shared convention, so each component names its parts, variants and states differently.
- Shared style logic (focus rings, visually hidden text, breakpoints) has to be copied, because plain CSS has no mixins.

## Decision

### SCSS for every stylesheet

All stylesheets in the project are written in **SCSS** (`.scss`), compiled by Vite with `sass-embedded`.

- Component styles stay **CSS Modules**: `<component>.module.scss`. CSS Modules keeps scoping each component; SCSS only changes how the styles are written.
- SCSS is used for **authoring**: nesting, the parent selector (`&`), partials and mixins.
- **Design tokens remain CSS custom properties.** SCSS variables are not used for design decisions, because they disappear at build time and could not be themed at runtime. A mixin or a partial may use tokens, never replace them.
- Shared mixins (for example the focus ring or visually hidden text) live in the design system and are imported with `@use`.

### BEM for class names

Class names follow **BEM** (Block, Element, Modifier):

| Part | Syntax | Example |
|---|---|---|
| Block | `.block` | `.button` |
| Element | `.block__element` | `.button__icon` |
| Modifier | `.block--modifier` | `.button--secondary` |

- **One block per module**, named after the component, so the class name, the file and the component match.
- Elements and modifiers are written with SCSS nesting (`&__icon`, `&--secondary`), so each block lives in one place.
- **Variants are modifiers** (`.button--primary`, `.button--secondary`).
- **Interaction states come from React Aria's data attributes** (`&[data-hovered]`, `&[data-focus-visible]`, `&[data-disabled]`), not from BEM modifiers, because React Aria already manages them.
- Nesting stays shallow (block → element or modifier → state), so selectors keep low specificity.

## Alternatives considered

- **Plain CSS with native nesting:** browsers now support nesting, but not BEM's `&__element` concatenation, nor mixins or partials.
- **Global SCSS with BEM and no CSS Modules:** BEM alone would have to prevent collisions through prefixes, and every product consuming the design system would share one global namespace. CSS Modules already solves scoping.
- **Utility classes (Tailwind):** rejected in [ADR-0007](0007-design-system-react-aria-tokens.md).

## Consequences

### Positive

- Stylesheets are shorter and grouped by block: a component's elements, variants and states live together.
- One naming convention for every component makes styles predictable and easy to review.
- Shared style logic is written once as mixins.
- Scoping and runtime theming are unchanged: CSS Modules and CSS custom properties still do that work.

### Negative

- One more build dependency (`sass-embedded`) in every project that compiles styles.
- SCSS features can be overused (deep nesting, logic in stylesheets). Nesting depth and the use of tokens have to be kept in check in code review and, later, with stylesheet lint rules.
- Component class names combine a block and a modifier, so the component builds the class list from the module.

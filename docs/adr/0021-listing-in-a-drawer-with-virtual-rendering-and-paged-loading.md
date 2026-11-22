# ADR-0021: The listing opens in a side drawer, with virtual rendering and paged loading

- **Status:** Accepted
- **Date:** 2026-11-22
- **Category:** Architecture

## Context

The listing of advisory firms shows each one with its basic data and lets the user search and filter by province and specialty. Looking up a firm is usually done in the middle of another task, such as reviewing the network or an alert, so leaving the current page to do it loses the context.

The network has 50 advisory firms today, but the listing has to keep working with 5,000. Loading and rendering every firm at once does not scale:

- **Network and API:** the response grows with the network, and every new search or filter downloads it all again.
- **Browser:** rendering thousands of rows creates thousands of DOM nodes, which makes the drawer slow to open and to scroll.

The frontend already handles side effects as streams with redux-observable ([ADR-0004](0004-frontend-react-redux-observable.md)), and the design system is built on React Aria ([ADR-0007](0007-design-system-react-aria-tokens.md)).

## Decision

### A side drawer over any page

- The listing is a **drawer that slides in from the side**, over the page being shown. It opens from the sidebar of the application.
- **Its state lives in the URL**: whether it is open, the search and the filters. A reload, a shared link or going back from a detail page opens it as it was.
- Closing it leaves the page behind as it was. Opening an advisory firm goes to its detail page, whose "back" link returns to the page and the drawer it came from.

### Paged loading from the API

- `GET /advisory-firms` returns **one page at a time**, with keyset (cursor) pagination: the firms are sorted by name and id, and each page carries the cursor of the next one. Unlike an offset, a cursor costs the same on the last page as on the first, and does not skip or repeat rows when data changes between pages.
- The response also carries the **total** that match the search and the filters, for the counter.
- **Searching and filtering happen in the database**, never in the browser: the browser only ever holds the pages it has loaded.

### Virtual rendering in the design system

- The design system offers a **virtualized list** built on the React Aria `Virtualizer`: only the rows in view, plus a small margin, exist in the DOM, however many are loaded.
- When the user scrolls near the end, a **load-more item** at the bottom of the list asks for the next page. It is announced to screen readers while it loads.
- Applications use the component of the design system, never React Aria or the virtualizer directly, so the technique can change without touching them.

### The loading flow as streams

The epics of the listing describe the whole flow with RxJS operators:

- **Typing in the search** is debounced (`debounceTime`) and repeated values are ignored (`distinctUntilChanged`), so the API is asked once the user stops typing.
- **A new search or filter** loads the first page with `switchMap`: the request for the previous search is cancelled, so a slow answer never overwrites a newer one.
- **Asking for more** while a page is loading is ignored with `exhaustMap`, so scrolling fast never asks for the same page twice. The next page is asked for only if there is a cursor.
- **Closing the drawer** cancels whatever is in flight (`takeUntil`).

## Alternatives considered

- **A listing page as the home page:** what the brief describes literally, but it moves the user away from the network overview to look up a firm, and back again.
- **Loading every firm and filtering in the browser:** the simplest option and fine for 50, but the payload and the DOM grow with the network.
- **Classic pagination with page numbers:** avoids virtualization, but breaks the flow of scanning a list and does not fit a narrow drawer.
- **Offset pagination (`limit`/`offset`):** simpler, but the database reads and discards every row before the offset, and rows shift between pages when data changes.
- **A virtualization library such as TanStack Virtual:** proven and headless, but React Aria already ships a virtualizer that keeps keyboard navigation and screen reader support working on rows that are not in the DOM, without adding a dependency.

## Consequences

### Positive

- Opening the drawer and scrolling cost the same with 50 firms as with 5,000: one page from the API and a few rows in the DOM.
- The user looks up a firm without leaving the page they were on.
- Race conditions between searches and duplicate requests are handled by the operators, not by flags in the state.

### Negative

- More moving parts than a plain list: a cursor in the API, a store that appends pages, and a virtualized component.
- Rows that are not loaded cannot be found with the browser's find-in-page; the search field is the way to look for them.
- Virtualized lists need a known row height to place rows, so rows have a fixed height.

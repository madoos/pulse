# CLAUDE.md

## Rules

### Follow the ADRs

Architecture Decision Records live in `docs/adr/` (index in `docs/adr/README.md`). They are binding for this repository.

- Before making changes, read the ADRs that apply to the task and follow them.
- If a request conflicts with an accepted ADR, do not silently break it: point out the conflict and propose either following the ADR or writing a new ADR that supersedes it.
- When a significant decision is made (stack, architecture, data model, tooling, conventions), propose a new ADR `docs/adr/NNNN-short-title.md` and add it to the index.
- Accepted ADRs are never rewritten; a changed decision gets a new ADR and the old one is marked `Superseded by ADR-XXXX`.

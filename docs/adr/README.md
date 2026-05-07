# Architecture Decision Records

This directory holds full ADR bodies. `docs/adr-log.md` is the ADR index plus
legacy inline history.

Reading rule:

1. Read `docs/contracts.md` and other active contract docs first.
2. Use `docs/adr-log.md` as the ADR index.
3. Open only the specific ADR files relevant to the behavior being changed.

ADRs explain decision history and rationale. Current enforceable behavior lives
in `docs/contracts.md`, `docs/architecture.md`, and the other active contract
docs named in `docs/index.md`.

## Write Workflow

Use the hybrid index-first model:

1. New ADRs are written as separate files in this directory.
2. `docs/adr-log.md` gets a short index entry with status, date, link, and
   decision summary.
3. Old inline ADRs are split out only when they are relevant to current work,
   frequently cited, large/noisy, or being amended/superseded.
4. Do not migrate the full historical log for neatness alone.

File naming:

```text
ADR-HA-XXX-short-kebab-title.md
```

When an old inline ADR is split out, leave a compact pointer in
`docs/adr-log.md` instead of deleting the ADR number from the index/history.

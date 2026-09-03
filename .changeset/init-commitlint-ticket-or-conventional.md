---
'@jjuidev/jss-devtools': minor
---

`init` now emits a richer `commitlint.config.mjs` that accepts either a `TICKET-<num>`-prefixed commit header (for traceability) or a conventional `<type>[(<scope>)][:!]: <subject>` header.

- New inline plugin `headerRegexPlugin` (regex-based, regex constants `TICKET_REGEX` + `CONVENTIONAL_REGEX` extracted as module-level lets for easy extension).
- Still extends `@commitlint/config-conventional` for built-in type-enum, header-max-length, subject-case, etc.
- Subject is intentionally permissive (`.*`) — case and trailing-period left to the built-in rules, so no overrides needed.
- Adds 6 unit tests covering TICKET_REGEX / CONVENTIONAL_REGEX literals, plugin extraction, brace/bracket balance, and the absence of subject-case / subject-full-stop overrides.

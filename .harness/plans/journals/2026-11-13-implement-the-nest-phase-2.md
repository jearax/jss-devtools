# Journal: implement the nest phase 2 (plan 261112-1647)

- The Write-garbling failure mode struck three more times (a fake `' NestJS schematics placeholder'`
  list entry, `theEmbeddedMapEqualsTheFolder`, `gavStage`, and a stray `toundm` path in an Edit).
  What worked: mechanical extraction via `sed` from verified files for bulk moves, small Edits for
  spot fixes, `node --check` + `grep -ci placeholder` after every generated file.
- ESLint `no-restricted-imports` negation is gitignore-strict: `!../scripts/**` and
  `!../scripts/*` cannot re-include under a `../*` ban; only `!../scripts` re-includes. Probed
  with a scratch Linter script against the repo's ESLint before touching the rule.
- Vitest/tsdown `define` parses a JSON define value into an object literal, not raw text:
  `JSON.parse(__NEST_TEMPLATE__)` choked on `[object Object]`. The repo convention
  (`__JSS_PACKAGE__` declares the object type, consumed directly) was the fix; the same JSON
  literal rule explains why `__HARNESS_HOOK_BUNDLE__` remains a string.
- `execFileSync` errors carry the exit status on `error.status`; `error.code` is an errno string
  or undefined. The first `git check-ignore` handler keyed on `error.code === 1` and rethrew the
  benign "nothing ignored" case (check-ignore exits 1 when nothing matches).
- A regex-merge of `NODE_PRESET_DEPENDENCIES` into the scratch manifest matched only quoted keys
  (13 of 19); the scratch install then failed at `prepare: husky`. Match `(?:'x'|bare): 'v'`.
- The node preset pins survived the rerun unchanged (prettier 3.10.1, typescript 7.0.2 both too
  new, stepped down to the already-pinned versions) — `git diff` on the constant is clean.
- vitest 5.1.0 (major bump from the 4.1.12 phase 1 resolved) proved green on the template's
  8 unit tests and 7 e2e tests with no config change.
- Long `rm -rf` of the proof scratchpad goes in the background or gets its own generous timeout;
  phase 1 hit the same wall.

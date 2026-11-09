---
phase: 1
title: "Change the defaults"
status: completed
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: Change the defaults

## Files

- `src/modules/harness/templates/harness-config.template.ts`: the new values.
- `tests/harness-doctor.test.ts`: the memory over-limit and near-cap cases assert `3000`; derive the
  limit from `HARNESS_CONFIG_DEFAULTS` (and size the padding from it) instead of a literal.
- `tests/harness-hooks.test.ts`, `tests/bundle.test.ts`, `tests/harness-update-units.test.ts`: their
  config literals are fixtures passed on purpose; change one only where it stands for "the default"
  (the update test that checks a missing key is written back with its default), otherwise leave it.
- `plans/261101-0204-init-harness/content/.harness/config.json`: match the template.
- Help snapshots or docs that print a default value, if any (`grep -rn 3000 docs tests`).

## Steps

1. Change the template.
2. Run `pnpm vitest run tests/harness-doctor.test.ts tests/harness-update-units.test.ts
   tests/harness-hooks.test.ts`; fix the tests that assert the default, not the ones that pass
   their own config.
3. Update the draft.
4. Full gate.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

One `init -y` into a temp folder; `.harness/config.json` shows the new values.

## Risk and rollback

Values only; revert the commit. Installed repositories are unaffected because update keeps
existing values.

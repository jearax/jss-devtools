---
phase: 1
title: "Remove code, tests, dependency"
status: pending
effort: 1h
---

# Phase 01: Remove code, tests, dependency

## Context

- Router: `src/cli/router.ts` (4 entries: `update/upgrade/downgrade/uninstall`).
- `init` imports `CommandResultStatus` from `@/commands/self/utils/result` (`src/commands/init/types.ts:3`). This is the only link from init to self.

## Files

### Delete

| Path | Reason |
|---|---|
| `src/commands/self/` (all 9 files) | Self commands |
| `src/core/detector/global-pm.ts` | Used only by self |
| `src/core/detector/pm.ts` | Used only by self + global-pm |
| `src/core/detector/types.ts` | Used only by self + global-pm |
| `src/core/self-installer/exec.ts` | Used only by self |
| `src/core/store/store.ts` | PM ledger for self; sole consumer of `conf` |
| `src/core/version-resolver/` (2 files) | Used only by self; init has its own semver logic in `resolve-specs.ts` |
| `tests/upgrade.test.ts`, `tests/uninstall.test.ts`, `tests/detector.test.ts`, `tests/exec.test.ts`, `tests/store.test.ts` | Tests for deleted code |

### Modify

| Path | Change |
|---|---|
| `src/cli/router.ts` | Remove the 4 self entries |
| `src/commands/init/types.ts` | Define `CommandResultStatus` locally; drop the import from self |
| `tests/smoke.test.ts` | Remove the 4 self `--help` cases; add a case asserting `upgrade` exits ≠ 0 and `--help` lists no self commands |
| `package.json` | Remove `conf` from `dependencies` |
| `pnpm-lock.yaml` | Regenerate via `pnpm remove conf` |

### Keep (untouched)

`core/registry-client/*`, `core/runner/pm-commands.ts`, `core/detector/project-pm.ts`,
`core/detector/monorepo-signals.ts`, `utils/prompts.ts` (`confirmOrCancel` is still used by
`init/utils/confirm-plan.ts`), deps `semver`, `execa`, `package-manager-detector`, `nypm`.

## Steps

1. Move `CommandResultStatus` into `src/commands/init/types.ts`.
2. Update the router; delete the files in the Delete table.
3. `pnpm remove conf`.
4. Update `tests/smoke.test.ts`.
5. Verify no references remain:
   `grep -rnE "commands/self|global-pm|detector/pm'|detector/types|self-installer|core/store|version-resolver" src tests` → empty.
6. Keep `src/core/detector/` as is (it still holds init's files); no renames.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm install --frozen-lockfile
node dist/cli/cli.js --help          # only version, help, init
node dist/cli/cli.js upgrade; echo $? # ≠ 0
```

Manual gate (user): `pnpm pack` → `npm i -g "$PWD/<tgz>"` → `jss-devtools init --framework node --dry-run`.

## Commit

`refactor(cli)!: remove self-management commands`, with a `BREAKING CHANGE:` footer listing the 4
commands and their native replacements. Commit locally; do not push.

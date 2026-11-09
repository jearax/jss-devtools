# Cooker report: dry-run apply line names the full command

Plan: `plans/261103-1124-dry-run-apply-line/plan.md`

## Result

The "To apply" line after `--dry-run` now shows the command the user typed, including the
nested path (`jss-devtools harness update -y`), built from the root program's `rawArgs`.

## Changes

- New `src/core/utils/apply-command-line.util.ts`: `applyCommandLineOf` walks `command.parent`
  up to the root, slices off `node` and the script path, drops `--dry-run`, and prepends
  `PACKAGE.name` (the `bin` key). The parameter is typed structurally (`CommandLike`) because
  the architecture rule forbids importing `commander` outside `*.command.ts` and `cli.ts`.
  `parent` accepts `null | undefined` to match commander's typing.
- `src/commands/harness/update.command.ts`: deleted `typedWordsOf` and the local
  `applyCommandLineOf`; imports the shared helper. Both dry-run call sites unchanged.
- `src/commands/init/init.command.ts`: deleted `typedWords` and `applyCommandLine`; calls the
  shared helper.
- `tests/harness-update-units.test.ts`: replaced the two faked-parent tests with four tests
  parsing through a real commander tree:
  - nested `harness update --dry-run -y` → `jss-devtools harness update -y`
  - top-level `init my-app --pm pnpm --dry-run` → `jss-devtools init my-app --pm pnpm`
  - empty positional `init '' --dry-run` → `jss-devtools init ''` (kept quoted)
  - space-containing positional → `'some value'` (kept quoted)

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green:

- lint: clean
- typecheck: clean
- test: 472 passed, 7 skipped, 0 failed
- build: `dist/cli.mjs` 333.17 kB, complete

Acceptance "No `rawArgs` read from `command.parent` remains in `src/`" holds: the only
`parent` reads left are the root walk in the new helper, by design.

## Notes

- Commander keeps `--` in `rawArgs`; the empty-argument case is covered through `init`'s
  positional instead of a `--` separator, matching how the plan's quoting case was exercised.
- Test trees define minimal options/arguments (`--dry-run`, `-y`, `[dir]`, `[value]`) so
  commander accepts the parsed argv without process.exit.

Status: DONE
Summary: Shared root-walking helper replaces the duplicated parent.rawArgs reads; nested commands now show their full path in the dry-run apply line; four real-commander tests pass and the full check sequence is green.

---
phase: 2
title: "Base copies, index drift, doctor, log, timeouts"
status: completed
priority: P2
effort: 4h
dependencies: [1]
---

# Phase 2: Base copies, index drift, doctor, log, timeouts

## B5. Base copies that do not match the manifest

`applyUpdatePlan` writes the action files, then the manifest, then the base copies; a crash in
between leaves base copies of the old release under a manifest of the new one, and
`ensureBaseCopies` (`update-preflight.service.ts`) checks only that they exist.

- Preflight hashes every base copy against its manifest `sha256`. A mismatch stops the update
  before anything is written: `CliError` naming the files, next step `git checkout .harness/core`.
  Do not repair from the release: the right base is the installed version's content, which this
  CLI may not have.
- Test: a base copy edited after install; `harness update` exits 1, names it, writes nothing.

## B10. A second table in `decisions/README.md`

`index-drift.service.ts` reads every `|` line of the README and takes the first four digits of the
first cell, so a second table with a date column reports a decision `2026` with no file.

- Read only the table whose header's first cell is `#`, and treat a row as a decision only when its
  first cell is a four-digit id (bare or as a link text).
- Test: a README with the decisions table plus a second table whose first column holds
  `2026-11-03`; no drift reported. The existing drift tests still pass.

## Doctor: the Memory row

`summaryRows` (`src/commands/harness/services/doctor.service.ts`) hardcodes the Memory row as `ok`,
so an over-limit memory shows `✔ Memory` next to `✖ Memory`.

- The Memory summary row takes the worst level among the memory issues (`ok`, `info` for a
  warning, `fail` for an error).
- Test: memory over the limit; the summary row is not a tick.

## `hook-errors.log`

`hook-errors.service.ts` appends forever and reads the whole file at every SessionStart.

- Cap the file at a named size in `harness-limits.constant.ts` (64 KiB): when an append would pass
  it, keep the newest half. Keep the cursor that marks "since the last session" correct after a
  trim (reset it when the file shrinks below it).
- Test: a log over the cap; after one more error the file is under the cap and the newest line is
  kept; the next SessionStart reports only the new errors.

## S3. Config keys written three times

`HarnessConfig` (`types/hook.type.ts`), `HARNESS_CONFIG_DEFAULTS` and `NUMBER_KEYS`
(`config.service.ts`) each list the seven keys.

- Derive `NUMBER_KEYS` from `HARNESS_CONFIG_DEFAULTS` so a key added to the defaults is validated
  without a second edit. Keep the type as it is unless deriving it is a one-liner.

## S8. Hook timeouts

`hook-settings.constant.ts` writes no `timeout`, so Claude Code's default applies. The Claude Code
hooks reference (code.claude.com/docs/en/hooks, read 2026-11-03): `timeout` is a per-handler field
in seconds, default 600 for `command` hooks, not enforced on `async: true` hooks; a timed-out hook
is cancelled and its output discarded.

- Add `timeout: 30` to the three synchronous entries (SessionStart, the memory guard, Stop), from a
  named constant in `harness-limits.constant.ts`. Leave the async entries without one.
- `harness update` must bring an installed `.claude/settings.json` to the new entries; extend the
  settings merge and its test if it compares entries without the new field.
- Tests: the generated settings carry `timeout: 30` on the three sync entries only; an update over
  settings written by the previous release adds it.

## Docs

- `docs/system-architecture.md` or the harness section of `docs/project-roadmap.md`: one line each
  where they describe the update preflight and the hook entries, only if they state the old
  behaviour.

## Acceptance

- Each test above fails on the current code and passes after the fix.
- Full gate green.

---
title: "Uninstall plan closed: manual-test campaign drove 5 real fixes"
date: 2026-08-27
summary: "Phase-03 uninstall hardening shipped local: 5 manual-test findings fixed (npm11/yarn parsers, json purity, EPIPE, stdio-capture, probe timeout), 44/44 tests, as-built flow diagram, committed in 3 commits."
---

# Uninstall plan closed: manual-test campaign drove 5 real fixes

## What happened

- Executed phase 3 of plan `260821-1050-uninstall-command-design` (uninstall-scoped after user narrowed from 4-command shared guard) with kongming `--advice` checkpoints pre- and post-phase (both GO; reports in `plans/reports/kongming-260827-*.md`).
- Kongming pre-phase review caught a spec bug before code: install-hint must source `ledger.lastPm`, not "pmsSeen last" (first-seen order lies).
- Implementation R1–R4 test-first: local `removeOrReport` boundary guard (`PM_EXEC_FAILED`, rich form), notes standalone in human mode, `PM_DISPLAY_NAMES` prompt, install-hint with lastPm whitelist.
- User manual testing then found **5 real defects unit tests could not** (all fixed same day):
  1. npm 11 changed `npm ls -g --json` shape (plain keys + nested version) — npm probe was blind.
  2. yarn v1 emits NDJSON events, package only as `info "pkg@ver" has binaries` — yarn probe never worked at all.
  3. consola `info` wrote to stdout corrupting the single-JSON-doc contract — logs now route to stderr (Unix: stdout=data, stderr=logs).
  4. `write EPIPE` crash on successful runs when `| jq` closes the pipe early — EPIPE guard exits 0 quietly.
  5. PM probes had no timeout — a wedged `yarn global list` hung the CLI forever; now 10s cap.
- User-approved scope-in: stdio-capture for `--json` real-exec (deferred Phase-04 item pulled forward; kongming minimal design) — child output piped, discarded on success, stderr embedded in failure message. Invariant "stdout = exactly 1 JSON doc in every outcome" now holds live.
- Environment lessons recorded in phase doc: yarn v1 resolves relative tarball paths against its global dir (use absolute); caches file-tarballs by path without content revalidation (`yarn cache clean jss-devtools` scoped is insufficient; full clean or fresh path); `pnpm pack` (no `v`) vs `yarn pack` (with `v`) filename trap.
- Replaced plan.md's outdated design flowchart with an as-built mermaid: 7 function clusters color-coded by the 3-tier log/throw framework (chat2k 2026-08-21) — command layer / boundary guards / throw-y core.
- Final gates: lint 0 · typecheck 0 · **44/44 tests** (was 23 at phase start) · build ✓.

## Decision

- Keep boundary guards local per command (modular-per-command strategy); core stays throw-y — validated end-to-end by the live failure paths.
- Non-TTY guard keys on `process.stdout.isTTY` (stdin irrelevant) — confirmed correct in manual test MT3; documented in the as-built diagram.
- Kept `--json` support (user considered dropping it during a false alarm caused by stale yarn cache serving pre-fix bits).

## Next steps

- Template is ready: apply the same pattern to upgrade/downgrade/update design docs (deferred items in phase doc: shared guard, ExecResult cleanup, capture-enable for 3 other commands, downgrade→runUpgradeFlow merge, store-boundary validation, top-level message cleanup).
- Suggest adding `*.tgz` to .gitignore (pack artifact currently untracked by name only).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

---
title: "Phase 3 uninstall cleanup: scope narrowed, test-first, corrupted-ledger guard"
date: 2026-08-26
summary: "Uninstall-scoped R1-R4 landed local (uncommitted): exec-fail guard, standalone notes, install-hint + review-driven lastPm whitelist fix; gates 32/32; kongming GO."
---

# Phase 3 uninstall cleanup: scope narrowed, test-first, corrupted-ledger guard

## What happened

- Resumed plan `260821-1050-uninstall-command-design` phase 3. User narrowed scope mid-session: shared guard 4 commands → **uninstall only** (no exec.ts/prompts.ts/other-command edits); `--dry-run` + TTY/non-TTY kept as planned.
- Kongming pre-phase review (GO) caught a spec bug: hint source must be `getPmLedger().lastPm`, not "pmsSeen cuối cùng" (pmsSeen is first-seen order; `tests/store.test.ts:45-52` proves).
- Test-first: `tests/uninstall.test.ts` written before implementation (7/8 red), then R1–R4 implemented:
  - R1 `removeOrReport` boundary guard in `uninstall.ts` (json rich-form `PM_EXEC_FAILED` + exit 1, human short error via execa `shortMessage`, never throws).
  - R2 notes standalone `logger.warn` gate `!jsonMode`, stripped from prompt (kongming double-print advice).
  - R3 `PM_DISPLAY_NAMES` in prompt.
  - R4 hint in `requireGlobalPM` (`flow.ts`): `lastPm ?? 'npm'`, command via `resolveCommand(pm,'global')`, json `error.hint` field.
- Independent code-review found **HIGH**: `resolveCommand('bogus-agent',...)` throws raw TypeError (verified against pinned pmd 0.2.11) → corrupted ledger `lastPm` would crash the PM_NOT_DETECTED path of all 4 commands. Fixed: `last in PM_DISPLAY_NAMES` whitelist → npm degrade + `bogus-agent` test. Also fixed pre-existing cancelled-payload `dryRun:false` hardcode in the touched block.
- Gates after fixes: lint ✓ typecheck ✓ test **32/32** ✓ build ✓ (one eslint --fix pass for new-file formatting).

## Decision

- Guard stays local to uninstall.ts (per-command modular strategy); core exec stays throw-y (3-tier log/throw framework, `chat2k/chat2k-2026-08-21-log-vs-throw-guards.md`).
- Whitelist validation over try/catch (kongming endorsed): deterministic degrade, doesn't mask other store-shape bug classes.
- Deferred (recorded in phase doc): stdio-capture json (Phase 04 pre-publish blocker), store-boundary pmsSeen validation, downgrade→runUpgradeFlow merge, ExecResult dead-field cleanup, top-level `message:""` cleanup.

## Next steps

- **User manual test tomorrow** (11-step checklist in `plans/reports/kongming-260827-0105-uninstall-phase3-close-verdict.md`): pack/link lifecycle, TTY confirm rendering, real exec-fail, json purity `| jq`, corrupted-ledger hand-edit, non-TTY refuse. Then commit local (no push).
- Housekeeping at commit: stray 1-line comment removal in `downgrade.ts` — fold+disclose or revert (user call).
- After commit: stdio-capture as Phase 04 opener.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

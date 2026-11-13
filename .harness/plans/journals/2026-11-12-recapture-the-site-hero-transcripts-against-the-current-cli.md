---
title: Recapture the site hero transcripts against the current CLI
date: 2026-11-12
summary: Three transcripts in site/src/constants/transcripts.constant.ts were stale after 3bdc477 and were recaptured from real runs via the capture-cli-transcript skill; two stayed byte-identical.
---

# Recapture the site hero transcripts against the current CLI

## What happened

- `INIT_RUN_TRANSCRIPT` was missing the new post-install task: the CLI now prints `◇ Formatted 43 files` between `Sorted package.json` and `└ Next steps`; install time changed to `12.1s`.
- `INIT_TRANSCRIPT` drifted more than expected: the dry-run file list gained entries (`.claude/skills/harness-*`, `.harness/bin/hooks.mjs`, `.harness/core/base/**`), and the run ends with `Assumed npm for this plan; pass --pm to pick another` plus a `To apply:` block. Count still `51 to create`.
- `HARNESS_ONBOARDED_TRANSCRIPT` numbers (`833`) were an artifact of the previous sample onboarding answers; a real re-onboarding (three memory lines, one decision) gives `735/9600 chars, 8 entries, Decisions 1`.
- `DOCTOR_TRANSCRIPT` and `HARNESS_TRANSCRIPT` were byte-identical to fresh captures; `INSTALL_TRANSCRIPT` is installer output, not a CLI run, and still matches the `0.1.0` home.

Captures followed the capture-cli-transcript skill: pty `script` run at cols 100 rows 50 for the interactive init, replayed through @xterm/headless@5.5.0, hand onboarding per `.harness/BOOTSTRAP.md`. Constants were then verified programmatically line-by-line against the capture files rather than by eye.

## Decision

- The curated file-list sample keeps the same nine entries the old constant showed; all nine still exist in the new runs.
- Lines pasted exactly as the replay emitted them, including xterm's missing trailing resets — no hand-edited escape codes, per the skill.

## Verification

- `pnpm --dir site lint && typecheck && test (123/123) && build` all green; `pnpm lint` green.
- Report: `.harness/plans/reports/cook-261112-2112-recapture-site-transcripts.md`. No commit or push (as instructed).

## Next steps

- When init's output next changes, recapture all of this file's transcripts in one pass; the dry-run footer and the onboarded numbers are the ones that tend to drift silently.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

---
title: "Redaction catches home paths in Claude Code's encoded form"
description: "The home-path rule misses the dash-encoded paths Claude Code writes into reports (~/.claude/projects/-Users-<account>-..., /private/tmp/claude-501/-Users-<account>-...); add a private rule for them, without a version bump."
status: done
priority: P1
effort: 2h
branch: main
tags: [fix, harness, redaction]
blockedBy: []
blocks: []
created: 2026-11-14
---

# Redaction catches home paths in Claude Code's encoded form

## Overview

Policy: [decision 0054](../../decisions/0054-harness-doctor-is-the-only-guard.md) (the content check
is the guard) and [0056](../../decisions/0056-the-release-stays-at-0-1-0.md) (the version stays
0.1.0). Rules live in `src/modules/harness/constants/redaction-rules.constant.ts`; matching and
exemptions in `src/modules/harness/services/redaction.service.ts`.

Found while clearing this repository: after `harness doctor` passed, six tracked reports under
`.harness/plans/reports/` still named the account, because Claude Code encodes an absolute path
by replacing each separator with `-`, and agents copy those paths (project memory folders,
scratchpads) into reports. `home-path` matches only `/Users/<x>/`, `/home/<x>/` and
`C:\Users\<x>\`.

## Contract

- **Outcome:** `harness doctor` fails on a published file holding `-Users-<account>-` or
  `-home-<account>-` in the encoded position, and `redactLine` strips the account from hook logs and
  session context, exactly as `home-path` does for plain paths.
- **Constraints:** no version bump (user: "not bumpversion"); the user runs `harness update`
  here by hand. The rule is `kind: 'private'` (an error only in published files), reuses
  `EXEMPT_ACCOUNTS`, and keeps the bounded-pattern rule (200 kB line stays fast).
- **Non-goals:** other encodings, changing `home-path`, a repository self-scan test.
- **Acceptance:**
  1. A new rule `encoded-home-path` matches, for a non-exempt account `<acct>`:
     `projects/-Users-<acct>-Documents-x`, `claude-501/-Users-<acct>-Desktop-y`, a line-initial or
     backtick-initial `-home-<acct>-x`, and the Windows form `C--Users-<acct>-x`. Tests build the
     account at run time, so no file here holds a matching sample.
  2. It does not match kebab-case words: `site-home-page-hero`, `docs-Users-guide`,
     `my-home-dir` (an encoded path starts at a path boundary: start of text, whitespace, `/`,
     a backtick or a quote).
  3. Exempt accounts stay exempt (`me`, `runner`, every entry of `EXEMPT_ACCOUNTS`), and
     `-Users-<account>-x` does not match.
  4. `redactLine` turns `projects/-Users-<acct>-Documents-x` into
     `projects/-Users-<account>-Documents-x`.
  5. The 200 kB repeated-character line test stays under its time bound with the new rule.
  6. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass, and the built CLI's
     `harness doctor` in this repository exits 0.

## Phases

| #   | Phase                                                           | Status  |
| --- | --------------------------------------------------------------- | ------- |
| 1   | [Rule, tests and docs](./phase-01-rule-tests-and-docs.md)       | Done   |

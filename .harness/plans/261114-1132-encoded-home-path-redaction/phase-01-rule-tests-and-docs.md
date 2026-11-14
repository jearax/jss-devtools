---
phase: 1
title: "Rule, tests and docs"
status: done
---

# Phase 1: rule, tests and docs

## Files

- `src/modules/harness/constants/redaction-rules.constant.ts`: the rule, after `home-path`.
- `src/modules/harness/services/redaction.service.ts`: the exemption reads the account segment of
  an encoded match.
- `tests/harness-redaction.test.ts`: a sample in `SAMPLES` (the per-rule loop requires one), and
  the acceptance cases from the plan.
- `tests/harness-doctor.test.ts`: one case where a tracked report holding an encoded path makes
  `harness doctor` exit 1 with a `Private content` row naming `encoded-home-path`.
- `.harness/docs/system-architecture.md` and `site/src/constants/harness.constant.ts`: where the
  private shapes are listed, say home paths are caught plain or as Claude Code encodes them.

## Steps

1. Add `encoded-home-path`, `kind: 'private'`, replacement `-Users-<account>-`. The pattern starts
   at a path boundary (start, whitespace, `/`, a backtick or a quote) through a lookbehind, takes
   an optional Windows drive prefix (`[A-Z]-`), then `-(?:Users|home)-`, then a bounded account
   segment without `-` or `<`, then `-`. Keep every quantifier bounded.
2. Exemption: the account segment is checked against `EXEMPT_ACCOUNTS`, as `home-path` does.
3. Tests per the plan's acceptance 1 to 5, samples built so the test file itself holds no real
   account name.
4. Docs: one clause in each of the two files; no new section, no decision edit.

## Validation

- `pnpm vitest run tests/harness-redaction.test.ts tests/harness-doctor.test.ts`
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `node dist/cli.mjs harness doctor` in this repository exits 0.
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`

## Risk

- A false positive on prose: the boundary lookbehind is what keeps `site-home-page` out; the
  negative cases pin it.
- Hook redaction runs on every log line: the bounded pattern keeps it linear.

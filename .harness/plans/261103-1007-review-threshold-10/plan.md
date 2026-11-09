---
title: "Review threshold 10"
description: "The default review.minToolCalls that init writes to .harness/config.json becomes 10."
status: completed
priority: P2
effort: 30m
branch: main
tags: [harness, config]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Review threshold 10

## Outcome

`jss-devtools init` writes `review.minToolCalls: 10` to `.harness/config.json`. The user chose it
after the long-chain eval: "Chốt: minToolCalls 10 nhé." (user, 2026-11-03).

Evidence, from `~/Desktop/jss-harness-eval/plans/reports/eval-261103-0154-harness-long-chain.md`
(120 sessions, 5 runs per cell): a decision written by the first session's review carried a
chat-only policy to every later session at both 7 and 14 (20/20 each, baseline 5/20); threshold 14
asked for 11 of 20 reviews against 20 of 20 and cost 16% less, within noise at n=5; one 14-cell of
the other chain failed on contract misses the report does not attribute to the missing reviews. 10
sits between the two measured values. A failed call still always asks for a review
(`src/modules/harness/hooks/stop.hook.ts`).

## Change

- `src/modules/harness/templates/harness-config.template.ts`: `review: { minToolCalls: 10 }`.
- `tests/harness-install-plan.service.test.ts`: the expected default config.
- Any other test literal that stands for "the default" (not a fixture passing its own value).
- `plans/261101-0204-init-harness/content/.harness/config.json`: match the template, if it holds
  the key.
- `plans/261031-2325-init-harness-discussion/decision-log.md`: a new dated section after "Config
  defaults for a medium project", quoting the user, stating 10, the evidence above in two lines,
  and that installed repositories keep their value because `harness update` keeps existing keys.
  Mark the old section's `review.minToolCalls` 7 as superseded by the new section.

## Acceptance

- `init -y` into a temp folder writes `"minToolCalls": 10`.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- The other config defaults.
- A conditional review rule (proposed by the eval report, not chosen).
- Changing the value in repositories already installed.

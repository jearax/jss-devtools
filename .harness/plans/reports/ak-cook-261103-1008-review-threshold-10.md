# Cook report: review threshold 10

Plan: [261103-1007-review-threshold-10](../261103-1007-review-threshold-10/plan.md)
Status: DONE
Date: 2026-11-03

## Outcome

`init` now writes `review.minToolCalls: 10` to `.harness/config.json`, per the user's
decision "Chốt: minToolCalls 10 nhé." (2026-11-03).

## Changes

- `src/modules/harness/templates/harness-config.template.ts` — default 7 → 10 (the single source
  of truth; `tests/harness-hooks.test.ts` reads it through `DEFAULT_CONFIG`, so no edit needed).
- `tests/harness-install-plan.service.test.ts:274` — expected default config 7 → 10.
- `plans/261101-0204-init-harness/content/.harness/config.json` — 7 → 10.
- `plans/261031-2325-init-harness-discussion/decision-log.md` — new section "Review threshold 10
  (2026-11-03, supersedes `review.minToolCalls` 7 above)" quoting the user, two lines of eval
  evidence, and the installed-repositories note; the old "Config defaults for a medium project"
  heading now marks the key as superseded.

Other `minToolCalls` literals (`harness-update-units.test.ts`, `harness-hooks.test.ts:384/414`)
are fixtures passing their own values, not defaults — left alone per the plan.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — green:
  28 test files passed | 1 skipped, 443 tests passed | 7 skipped; both tsdown builds completed.
- Fresh `init -y` into `/private/tmp/claude-501/init-threshold-lcA0` wrote
  `"minToolCalls": 10` at `.harness/config.json:3`; folder removed afterwards.

## Not done

- No commit or push (user reviews and commits).
- No journal step (automatic journal not run; awaiting review per the invocation contract).

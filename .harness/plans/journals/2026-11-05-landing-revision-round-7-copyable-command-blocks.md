---
title: "Landing revision round 7: copyable docs command blocks"
date: 2026-11-05
summary: Gave every runnable command block in the docs a header copy button, per the plan in design-system/agentkit/plans/261105-0408-landing-revision-round7/, on refactor/site-landing
---

# Landing revision round 7: copyable docs command blocks

## What happened
- Round 7 of the landing revisions on `refactor/site-landing`. The three "Your first run" blocks on the Getting started page rendered with no copy affordance; the owner asked for the site's existing `CopyButton` in the `CodeBlock` header.
- All nine runnable blocks got `headerAction={<CopyButton feedback="icon" label=… value=… />}` — icon-only, Copy→Check, `role="status"` line for the screen reader, exactly the `Terminal.commandCopy` interaction shape, and the same slot the deleted home Getting-started section used. Swept instances, by page:
  - GettingStarted (3): `install.sh` (the `curl | sh` install command), `doctor`, `init` (`init my-app --pm pnpm`).
  - Init (3): `a new project`, `the current folder`, `dry run` — all `init` variants.
  - Install (1): `install.sh` (the same install command).
  - Harness (2): `update`, `resume` — both `harness update` variants.
- Stays bare, per the owner's runnable rule (`prompt="$"` = runnable): the `package.json` block in Init and the `.claude/settings.json` block in Harness — config prose examples with no prompt. Window titles everywhere are unchanged.
- Labels are per command family (`Copy the install command`, `Copy the doctor command`, `Copy the init command`, `Copy the harness update command`); the value is the exact command string, including flags.
- Tests: new `GettingStarted.test.tsx` (docs page) asserts the three buttons exist under their names and that clicking one puts `jss-devtools doctor` on the clipboard. Suite went 96 → 98 tests.

## Decision
- `feedback="icon"` instead of the deleted home section's text feedback: the owner decision pinned icon-only, and it matches what `Terminal` already does for command rows — one copy interaction shape across the site.
- The two Harness buttons share one label because both are the same command family (`harness update`); the copied value carries the flag that differs. Labels name intent, not flags.

## Verification
- Gate green from the repo root: lint, typecheck, 98/98 tests, build.
- Eye-checked both themes at 1440 on the owner's dev server at :5174 (reused, not restarted): light and dark screenshots of the whole first-run section — buttons sit right-aligned in the window headers, no layout shift, surfaces intact in dark. Keyboard focus shows the design system's 2px focus ring with 2px offset (verified computed style on a focused button).

## Next steps
- Owner review of the commit (nothing pushed). If a future docs page gains a multi-line runnable block, check how the copy value handles the prompt line — every swept block today is single-line.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

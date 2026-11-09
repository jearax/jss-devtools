# Task: harness plan, phase 3 (hooks and the embedded hook bundle)

Repository: `/Users/tandm/Desktop/yyyy`, branch `main`. Node 24.11.0, pnpm.

## Task

Implement `plans/261101-0204-init-harness/phase-03-hooks-and-hook-bundle.md` exactly: the hook
program under `src/modules/harness/`, its own bundle `hooks.mjs`, the bundle's text embedded in
`cli.mjs`, the shim template, and the tests. Nothing installs the hooks yet; that is phase 4.

## Read first, in this order

1. `CLAUDE.md` (repo rules), `docs/code-standards.md`, `docs/decisions/0024-core-and-command-layout.md`
2. `plans/261101-0204-init-harness/plan.md` and `phase-03-hooks-and-hook-bundle.md`
3. `plans/261031-2325-init-harness-discussion/decision-log.md`: sections "Hooks: ...", "Skills
   approved; the last curation is committed", "A missing key or invalid `config.json`"
4. `plans/261031-2325-init-harness-discussion/design-proposal.md`, sections 2, 3 and 5
5. `plans/261101-0204-init-harness/content/.harness/config.json` (keys and defaults) and
   `content/CLAUDE.md` (the block whose markers the hooks do not touch)
6. `tests/support/architecture-rules.ts` (the `modules/` rules and the `.entry.ts` role)
7. Reference only, do not copy: `/Users/tandm/Documents/jearax/dokploy/harness/src/hooks/*.ts`,
   `src/core/skill-usage.ts`, `src/core/harness-limits.ts`
8. Claude Code hooks reference, `https://code.claude.com/docs/en/hooks`, for payload and output
   fields (`additionalContext`, `decision: "block"`, `stop_hook_active`, `agent_id`, `async`)

## Files you may create or modify

- `src/modules/harness/**` (new)
- `tsdown.config.ts` and one new hooks tsdown config if you choose that mechanism
- `package.json` `scripts.build` only if the build order needs it (no other script changes meaning)
- `tests/harness-hooks.test.ts`, `tests/bundle.test.ts`, test fixtures and helpers under `tests/`
- `CLAUDE.md` ("Where things are" rows), `docs/system-architecture.md`, `docs/codebase-summary.md`,
  as the phase file's Docs section says
- `plans/261101-0204-init-harness/phase-03-hooks-and-hook-bundle.md`: only `status`

## Acceptance

- Every row of the phase file's Behavior table and every bullet under it holds, proven by a test.
- Curation is due on `curator.minLearnedSkills` and `curator.intervalDays` from
  `.harness/curator.json`, or when memory passes 0.8 of `memory.maxChars` and the last curation is
  at least a day old. The Stop hook writes `.harness/curator.json` (`{ "lastRun": "YYYY-MM-DD" }`)
  when the session used `harness-curate`.
- The index drift check skips `docs/` when `.claude/skills/ak-*` exists.
- `hooks.mjs` holds no `commander` or `@clack/prompts`; record its measured size and set the budget.
- Gate green and pasted with its real output:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Report the hook bundle size and one hook's wall time.

## Constraints

- **Comments: default zero.** Only a non-inferable trap, one line. No JSDoc that says what a thing
  is or does. Remove any comment that restates the code before you report.
- Every hook outcome exits 0; only `harness-hook.entry.ts` sets `process.exitCode`. No other file
  touches process exit (the architecture test enforces it).
- Pin every new dependency to an exact version; prefer none.
- A missing config key turns its feature off and is warned; no default in code.
- Use the existing git adapter; a git failure means "unknown", never "changed".
- **Do not commit, do not push.** The planner reviews and commits.
- Stay inside the files listed above. If the phase file is wrong or blocks you, stop and say so.

## Report

Write `plans/reports/cooker-261101-<HHMM>-harness-phase-03-done.md`: what changed (files), the gate
output, the measurements, deviations from the phase file and why. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

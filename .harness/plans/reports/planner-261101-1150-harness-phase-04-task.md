# Task: harness plan, phase 4 (init installs the harness)

Repository: `~/Desktop/yyyy`, branch `main`, HEAD `d1f51e2` (phase 3). Node 24.11.0.

## Task

Implement `plans/261101-0204-init-harness/phase-04-init-installs-harness.md` exactly:
`jss-devtools init` installs the harness by default, `--no-harness` turns it off, `--agent-kit`
runs `ak init` after the install, all through init's existing preflight, plan, dry run,
confirmation and writes.

## Read first, in this order

1. `CLAUDE.md`, `docs/code-standards.md`, `docs/decisions/0024-core-and-command-layout.md`,
   `docs/decisions/0029*` and `0030*` (init's flow and flag rules)
2. `plans/261101-0204-init-harness/plan.md` and `phase-04-init-installs-harness.md`
3. `plans/261031-2325-init-harness-discussion/decision-log.md`: the sections the phase file names
4. `plans/261031-2325-init-harness-discussion/design-proposal.md`, section 1 (the file table and
   kinds: managed, seed, block, config)
5. Every draft under `plans/261101-0204-init-harness/content/` (approved; encode the text as is,
   Prettier formatting aside). `BOOTSTRAP.create.md` and `BOOTSTRAP.existing.md` both install to
   `.harness/BOOTSTRAP.md`, by mode. `content/CLAUDE.md` is the block body between the markers.
6. `src/commands/init/` and its tests, `src/modules/harness/` (phase 3: `hook-settings.constant.ts`,
   `hook-bundle.constant.ts`, `templates/hook-shim.template.ts`, paths and constants)

## Files you may create or modify

- `src/commands/init/**`, `src/modules/harness/**`, `src/core/adapters/agent-kit.adapter.ts` (new)
- `tests/**` (the tests the phase file names, snapshot updates only where the default plan changed,
  and the moved assertion in `tests/bundle.test.ts`)
- `docs/decisions/0030*` (amendment), `docs/decisions/0031-*.md` (new), `docs/system-architecture.md`,
  `docs/codebase-summary.md`, `docs/project-roadmap.md`
- `plans/261101-0204-init-harness/phase-04-init-installs-harness.md`: only `status`

## Acceptance

- Every bullet of the phase file holds, proven by the tests it names.
- `tests/bundle.test.ts` proves the hook bundle text inside `cli.mjs` equals `dist/hooks.mjs`; the
  install plan imports `harnessHookBundle`, so tree-shaking keeps it. No `treeshake: false`.
- `--no-harness` output equals the previous snapshot byte for byte.
- The manifest records nothing about AgentKit; `--agent-kit` changes no harness file.
- `.harness/curator.json`, `.harness/state/` and `.harness/archive/` are not installed.
- One real run in a scratch repository outside this repo: `init -y` output and the `.harness/`
  tree, then the installed SessionStart hook run once by hand, injecting memory.
- Gate green with real output: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Constraints

- **Comments: default zero.** Only a non-inferable trap, one line. No JSDoc that says what a thing
  is or does.
- Templates are `.template.ts` files under `src/modules/harness/templates/`; the architecture rules
  apply. A file over 200 lines is split along a real boundary.
- The module layer knows nothing of commander or clack; only `src/cli.ts` touches process exit.
- No new dependency.
- **Do not commit, do not push.**
- Stay inside the files listed. If the phase file conflicts with a decision or blocks you, stop
  and say so in the report instead of guessing.

## Report

Write `plans/reports/cooker-261101-<HHMM>-harness-phase-04-done.md`: files changed, gate output,
the scratch-repository run, deviations and why. End with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

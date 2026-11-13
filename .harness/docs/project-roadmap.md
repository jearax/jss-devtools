# Project roadmap

Status is written from what was observed, never from intent. Anything not started says so.

## Done: Phase 0, source foundation

Plan: [../plans/261019-1055-phase-0-source-foundation/plan.md](../plans/261019-1055-phase-0-source-foundation/plan.md)

- Repository, pinned toolchain, and git hooks. The first commit is the toolchain, the second is the
  CLI entry point.
- A CLI with `--help, -h` and `--version, -v`, a single self-contained `dist/cli.mjs`, and tests for exit
  codes, the standalone bundle and the first architecture rules.
- This documentation set and the decision records.

## Done: toolchain alignment, then the review that followed

Plan:
[../plans/261019-0625-toolchain-alignment/plan.md](../plans/261019-0625-toolchain-alignment/plan.md).
Journal for the ten commits after it:
[../plans/journals/2026-10-19-reviewed-toolchain-and-cut-comment-load.md](../plans/journals/2026-10-19-reviewed-toolchain-and-cut-comment-load.md).

- The toolchain follows the `design-system` reference, with the deviations that reference has
  since fallen behind recorded in decisions 0014 and 0015.
- One source file expression, stated once and derived rather than restated, shared by the ESLint
  config, the lint scripts, lint-staged and tsconfig.
- Config files carry no comments that restate their contents, and code comments only where the
  code does not already say it.
- ESLint stayed on 10 because the reference's 9 is end-of-life.

## Done: phase 0 review fixes

Plan: [../plans/261019-1529-phase-0-review-fixes/plan.md](../plans/261019-1529-phase-0-review-fixes/plan.md).
Review: [../plans/reports/code-reviewer-261019-1519-phase-0-and-toolchain-review.md](../plans/reports/code-reviewer-261019-1519-phase-0-and-toolchain-review.md).

- The CLI runs when reached through a symlink, which is how bin shims and installers reach it.
  Before the fix it did nothing and exited 0.
- Type-only imports pass lint and typecheck together; vitest rules stay out of `src/`.
- lint-staged keys no longer overlap, and every tool a hook runs is pinned.
- `.env` variants are ignored; formatting facts shared by Prettier and the editor
  are declared only in `.editorconfig`.
- One Node floor, 24.11.0, and CI runs only that version
  ([decision 0026](../decisions/0026-node-floor-24.md)).

## Done: the install site on Dokploy

Plan:
[../plans/261019-1619-dokploy-install-site/plan.md](../plans/261019-1619-dokploy-install-site/plan.md).
How it runs: [deployment-guide.md](./deployment-guide.md).

- `curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh` installs the CLI, and
  `https://jss-devtools.jjuidev.com/` answers with the landing page: one English page with the
  product's real surface, on the site's own skin
  ([decision 0037](../decisions/0037-the-site-carries-its-own-host-skin.md)).
- The installer checks the Node floor, verifies the sha256 and writes the wrapper; the install suite
  runs it against a local release server.
- One nginx image carries the page, the installer and the bundle CI tested. CI smoke-runs every
  route against the container before it pushes, and calls the Dokploy webhook after.

## Done: the terminal UI layer

Report:
[../plans/reports/researcher-261020-0023-tui-framework.md](../plans/reports/researcher-261020-0023-tui-framework.md).

- `@clack/prompts` stays the rendering library, behind `src/core/ui/terminal.ui.ts`.
- The animated primitives fall back to plain lines when the output is piped or in CI, so a captured
  run carries no escape byte, and a failure is rendered on stderr with its fix hint.
- The animated spinner is drawn by the layer, not by clack, because clack's registers global
  process handlers while it runs and one of them turns a failure into exit 0.
- The guard that refuses to prompt without a terminal ships with the first prompt, because a clack
  prompt on a closed stdin never settles.

## Done: the core layout and the doctor command

Decisions:
[0023](../decisions/0023-exit-codes.md),
[0024](../decisions/0024-core-and-command-layout.md).

- `src/` has a shared `core/` and one folder per command under `commands/`, and a file name says what
  the file is: `.command.ts`, `.ui.ts`, `.service.ts`, `.check.ts`, `.adapter.ts`, `.util.ts`,
  `.constant.ts`, `.error.ts`, `.type.ts`.
- The boundaries are rules with a negative fixture each, so a rule that catches nothing is a comment
  rather than a rule.
- The exit codes are 0 and 1. A failed check throws `CliError`, which carries the exit code and the
  fix.
- `jss-devtools doctor` is the first command: it checks the Node version, whether git is installed and
  the package managers init supports, and each failure carries its fix. A manager that is missing or
  a yarn 2+ is shown as an informational row, not a failure.
- The package facts reach the CLI through one build define, so `src/cli.ts` holds no package literal.

## Done: the init command scaffold

Plan: [../plans/261022-0225-init-command-scaffold/plan.md](../plans/261022-0225-init-command-scaffold/plan.md).
Decision: [0029](../decisions/0029-shared-command-flags.md).

- `jss-devtools init` exists, with the shared flags `--yes, -y` and `--dry-run` and a help with an
  `Examples` section. It writes nothing yet: every run ends with "Nothing to set up".
- The shared flags are declared once in `src/core/constants/`, so the next command that asks a
  question attaches the same flags. `doctor` asks nothing and has neither.
- The flow that fills `init` is still open, and is drawn in the
  [init flow decision log](../plans/261022-0141-init-flow-discussion/decision-log.md).

## Done: the init node preset

Plan: [../plans/261027-1541-init-node-preset/plan.md](../plans/261027-1541-init-node-preset/plan.md).
Decision: [0030](../decisions/0030-init-node-preset.md); the discussion history is the
[init flow decision log](../plans/261022-0141-init-flow-discussion/decision-log.md).

- `jss-devtools init <dir>` creates a TypeScript node project that installs, lints, typechecks,
  builds and runs (`node dist/main.js`), with git hooks active; `jss-devtools init` sets up an
  existing repository, merging what the user owns and stopping with the owned-file list unless
  `--force`. Every check runs in preflight, before the first write.
- The preset ships ESLint, Prettier, EditorConfig, husky, lint-staged, commitlint and VS Code
  settings, with versions pinned in the CLI by `scripts/pin-node-preset.mjs` and written as caret
  ranges. For pnpm it writes `pnpm-workspace.yaml`; existing mode manages only its `allowBuilds`
  entries, never `strictPeerDependencies` or `engineStrict`.
- `tests/init.e2e.test.ts` proves a created project with each manager on `PATH` (npm and pnpm
  required; yarn 1 and bun skipped where absent), gated behind `INIT_E2E=1` because it installs
  from the registry.

## Done: init --monorepo creates a Turborepo

Plan: [../plans/261112-0959-init-monorepo-turborepo/plan.md](../plans/261112-0959-init-monorepo-turborepo/plan.md).
Decision: [0045](../decisions/0045-init-monorepo-creates-a-turborepo.md), which supersedes the
monorepo non-goal of [0030](../decisions/0030-init-node-preset.md) for create mode only.

- `jss-devtools init <dir> --monorepo` creates a Turborepo for pnpm, npm, yarn 1 and bun: the
  toolchain and the harness once at the root, one app at `apps/<framework>` named
  `@<project>/<framework>`, and an empty `packages/`. The root follows the Turborepo docs, with
  this repository's `typecheck` task name and top-level `packageManager`. Existing mode, and
  `init` without the flag, are unchanged.
- `tests/init-monorepo.e2e.test.ts` proves a created monorepo lints, typechecks, builds, caches
  (`FULL TURBO`) and runs with each manager on `PATH`, gated behind `INIT_E2E=1` like the
  single-package suite.
- `init` formats every file it writes with the project's own Prettier, in both modes
  ([0046](../decisions/0046-init-formats-the-files-it-writes.md)); both end-to-end suites assert
  `prettier --check .` passes right after init.

## Done: init --framework nest creates a Nest app

Plan: [../plans/261112-1647-init-nest-preset/plan.md](../plans/261112-1647-init-nest-preset/plan.md).
Decision: [0047](../decisions/0047-init-nest-preset.md), which supersedes the non-node non-goal of
[0030](../decisions/0030-init-node-preset.md) for nest.

- `jss-devtools init <dir> --framework nest` creates a Nest 12 ESM app: the real project in
  `templates/nest/` embedded in the bundle and copied by init, with the project name substituted
  and the shared toolchain devDependencies merged in; with `--monorepo` the app is `apps/nest` as
  `@<project>/nest` and the root stays as for node. The preset is create mode only: an existing
  folder refuses it before any write.
- The app answers every JSON response as `{ status, message, data }` in the request's language
  ([0049](../decisions/0049-nest-response-envelope.md)); `templates/nest/test/response.e2e-spec.ts`
  proves it inside the template, and the generated project's `test:e2e` runs it per manager.
- `tests/init-nest.e2e.test.ts` proves, per manager on `PATH` and gated behind `INIT_E2E=1`:
  single and monorepo apps lint, typecheck, pass `test` and `test:e2e` (the bad-body 400s in `vi`
  and `en` run there, through supertest), build, rebuild cached through turbo, and answer
  `GET /health/ready` 200 on a free port before the process is stopped; `prettier --check .` is
  asserted right after init. The gated suites stay local; CI runs none of them.

## Done: init installs the harness

Plan: [../plans/261101-0204-init-harness/plan.md](../plans/261101-0204-init-harness/plan.md),
phase 4. Decisions: [0030](../decisions/0030-init-node-preset.md) (amended),
[0031](../decisions/0031-init-installs-the-harness.md).

- `jss-devtools init` installs the repository harness by default in both modes: the `CLAUDE.md`
  block, `.harness/` (memory, bootstrap, decisions, docs, plans, templates, config, hook code,
  manifest and base copies), three `harness-*` skills and the five hook entries in
  `.claude/settings.json`. `--no-harness` writes exactly what init wrote before; `--agent-kit`
  only runs `ak init --docs-dir .harness/docs --plans-dir .harness/plans` after the install and
  decides the `CLAUDE.md` block variant — with AgentKit the block drops its plan row and the two
  folder READMEs teach no plan path at all, the plan skill owns the layout — changing no other
  harness file. Every harness check runs
  in preflight, before the first write. See
  [0034](../decisions/0034-claude-block-follows-agentkit.md) and
  [0035](../decisions/0035-plan-paths-follow-the-agentkit-setting.md).

## Done: harness update

Plan: [../plans/261101-0204-init-harness/plan.md](../plans/261101-0204-init-harness/plan.md),
phase 5. Decision: [0032](../decisions/0032-harness-update.md).

- `jss-devtools harness update` brings an installed harness to the templates inside the CLI:
  managed files by three-way merge, the `CLAUDE.md` block in unit space (rendered for the AgentKit
  setting update detects), `config.json` key by key
  (a missing key is repaired even at the same version), the harness entries in
  `.claude/settings.json` replaced with every other hook kept, the hook bundle always
  overwritten. Seeds, learned skills, `.harness/archive/`, `.harness/curator.json` and the
  toolchain are never touched, and the CLI never commits or suggests one.
- The update trusts nothing the repository holds: a manifest path that leaves the repository, a base
  copy that no longer matches the manifest and a staged session that is not valid JSON stop the run
  before the first write, each naming the file and the next step.
- The harness hook entries in `.claude/settings.json` carry a `timeout` of 30 seconds on the
  synchronous ones (SessionStart, the memory guard, Stop) and none on the asynchronous ones.
- With conflicts the live tree is untouched: base, local, upstream and a resolved copy are staged
  under `.harness/update/`, the run exits 1 naming `--continue` and `--abort`; `--continue`
  refuses copies that still hold markers, `--abort` discards. A conflict run asks no question,
  so the agent workflow works without a terminal.

## Done: harness doctor

Plan: [../plans/261101-0204-init-harness/plan.md](../plans/261101-0204-init-harness/plan.md),
phase 7. Decision: [0033](../decisions/0033-harness-doctor.md).

- `jss-devtools harness doctor` checks the harness installed in the current repository, read-only:
  the manifest, the `CLAUDE.md` block, the harness hook entries in `.claude/settings.json`, the
  hook files under `.harness/bin`, `config.json`, memory limits, index drift, decision records,
  secrets in `.harness/`, learned skills, managed-file drift, the base copies against the manifest,
  staged updates, the installed harness version against the running CLI and, with AgentKit,
  uncommitted `ak-*` skill edits. It prints a summary plus one row per issue and exits 1 when any
  issue is an error; `--help` lists the checks and the exit codes. The Memory summary row takes the
  worst level of the memory issues, so a broken memory never shows a tick next to a cross. Every
  rule lives once in `src/modules/harness/services/health-*.service.ts`, shared with the hooks and
  `harness update`.

## Not started

Each of these needs its own plan before implementation. Open questions that will shape them are
collected in
[../plans/261019-1050-jss-devtools-rewrite/open-questions.md](../plans/261019-1050-jss-devtools-rewrite/open-questions.md).

| Area             | What it covers                                                     | Open questions |
| ---------------- | ------------------------------------------------------------------ | -------------- |
| Toolchain module | Framework presets beyond `node` and `nest` (`react`, `rn`, `next`) | T1 to T5       |
| Harness module   | Managed files, first-run bootstrap, review trigger, curation       | H1 to H12      |
| Cross-cutting    | Which decisions carry over from the old prototype                  | X2, X3         |

## Dependencies between these

The core layout came first: the toolchain command needs somewhere to live, and the harness command
needs the same. The zero-command unknown-command fallback in `src/cli.ts` is gone, because `doctor`
is the first command. The release path exists, so a command can ship the moment it is merged to
`main`.

## Not committed to yet

The first-release version number. It is recorded as open rather than assumed here.

Native Windows support: not planned; the tool is built for Linux and macOS, Windows users use WSL
([0030](../decisions/0030-init-node-preset.md)).

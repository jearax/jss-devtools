# CLAUDE.md

Guidance for coding agents working in this repository.

## What this repo is

`@jjuidev/jss-devtools`, a rewrite of an existing CLI, built from scratch rather than forked. The
old implementation lives elsewhere and is a source of lessons, not code to copy. The goal and the
non-goals are in [.harness/docs/project-overview-pdr.md](.harness/docs/project-overview-pdr.md).

## Commands

```bash
pnpm install
pnpm build        # tsdown -> dist/cli.mjs
pnpm lint         # ESLint, with Prettier as a lint rule
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest; builds the bundle first via globalSetup
pnpm format       # eslint --fix, then prettier --write
pnpm format:check # prettier --check, reporting only
pnpm template:install      # reinstall every template's node_modules (pnpm install does it on a fresh clone; CI never)
```

The site is a second project with its own commands:

```bash
pnpm --dir site lint      # ESLint and Stylelint, the design system's rules
pnpm --dir site typecheck # tsc --noEmit
pnpm --dir site test      # Vitest Browser Mode, headless Chromium
pnpm --dir site build     # tsc --noEmit && vite build
```

## Before claiming something is done

Run the narrowest check that covers the change, then the full sequence before reporting:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

A change under `site/` runs the site's own sequence instead:

```bash
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
```

`pnpm lint` covers formatting, so `pnpm format:check` is only needed when you want to check without
writing. Report the command you ran and its real output. A check that was skipped is a limitation to
state, not a result to assume.

## Rules this repo enforces on itself

- **The repo is the authority.** If this file, the docs, or the code disagree with what you were
  told in chat, trust the repository and raise the conflict instead of guessing.
- **A push to `main` deploys.** CI builds the site image, pushes it to GHCR and calls the Dokploy
  webhook. Read [.harness/docs/deployment-guide.md](.harness/docs/deployment-guide.md) before pushing, and say what a
  push will do when you report the change.
- **Architecture is tested, not documented.** Boundary rules live in
  [tests/support/architecture-rules.ts](./tests/support/architecture-rules.ts) with a negative
  fixture each. Add a rule and its fixture together. The layout and the role suffixes are in
  [.harness/decisions/0024](.harness/decisions/0024-core-and-command-layout.md).
- **Failures stay non-zero.** Only `src/cli.ts` may touch process exit or global process handlers;
  the architecture test enforces this, because the previous release shipped a handler that turned
  crashes into exit 0. The deliberate exception is a `*.entry.ts` under `src/modules/`: a hook must
  never block a session, so it always exits 0.
- **One fact, one home.** The version, the dev runtime, the package manager and the bundled
  dependencies are each declared once. Do not add a second copy in a config file; read it from
  `package.json` instead, the way `scripts/package-info.mjs` does. Formatting facts shared by
  Prettier and the editor live only in `.editorconfig`, which both read.
- **Write what exists.** No placeholder markers, no speculative architecture, no stale documents.
  Purge retired design text rather than leaving it where agent retrieval will find it.
- **Raise open questions at the step that blocks them**, one question at a time, with the leaning
  and the reason. Do not batch them up front and do not decide one yourself.
- **Pin what you install.** Every dependency here is pinned to an exact version; the toolchain is
  not allowed to drift on its own.

## Where things are

| Path                        | What                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/cli.ts`                | The only entry point: builds the commander program, owns all process-level decisions           |
| `src/core/`                 | Shared code no command owns: the terminal layer, the error type, the exit codes, the utils     |
| `src/commands/`             | One folder per command; the file suffix says what the file is                                  |
| `src/modules/harness/`      | The repository-harness hook program; `harness-hook.entry.ts` is the entry Claude Code runs     |
| `templates/nest/`           | The real Nest 12 project the build embeds; init copies it, the pin script owns its versions    |
| `tests/`                    | vitest suites; `support/` holds scanners and helpers, `fixtures/` holds negative fixtures      |
| `scripts/install.sh`        | The installer the site serves; POSIX sh, shellchecked in CI, exercised by `tests/`             |
| `scripts/stage-release.mjs` | Stages the built bundle and its checksums into `release/` for the site image                   |
| `scripts/package-info.mjs`  | Reads the package facts the CLI is built with, once                                            |
| `site/`                     | The landing site: its own pnpm project, its own lint and tests, the design system as a package |
| `docker/`                   | The site image: nginx config, home page, Dockerfile, and the compose file Dokploy runs         |
| `ci/`                       | The smoke test the image job runs against the container                                        |
| `.harness/`                 | The repository harness: memory, docs, decisions, plans, templates; managed by `jss-devtools`   |
| `.harness/docs/`            | Project docs, plus the site conventions under `.harness/docs/site/`                            |
| `.harness/decisions/`       | The decision records: product policy, quoting the user                                         |
| `.harness/plans/`           | Plans and research reports. Canonical working state, owned by planning tooling                 |

## Config files

There is no `.npmrc` and no `.nvmrc`. pnpm reads its settings from `pnpm-workspace.yaml`, and the
only Node floor is `engines.node` in `package.json`, which `engineStrict` enforces at install.

Every config file assigns to a named const and exports it, so the export line names what it exports:
`export default eslintConfig`, not a bare `export default`. Applies to `eslint.config.mjs`,
`commitlint.config.mjs`, `tsdown.config.ts` and `vitest.config.ts`.

## Docs

- [.harness/docs/code-standards.md](.harness/docs/code-standards.md) — formatting, lint, naming, tests, commits
- [.harness/docs/system-architecture.md](.harness/docs/system-architecture.md) — entry point, build, test strategy
- [.harness/docs/codebase-summary.md](.harness/docs/codebase-summary.md) — the current tree, file by file
- [.harness/docs/project-roadmap.md](.harness/docs/project-roadmap.md) — what is done and what is not
- [.harness/decisions/](.harness/decisions/) — why each major choice was made, quoting the user

What each piece of work actually found lives in
[.harness/plans/journals/](.harness/plans/journals/), one file per plan. Read the journal before the plan: it
records the failures and the measurements that the plan itself does not.

Background research lives in [.harness/plans/261019-1050-jss-devtools-rewrite/knowledge-base.md](.harness/plans/261019-1050-jss-devtools-rewrite/knowledge-base.md),
and unresolved questions in
[.harness/plans/261019-1050-jss-devtools-rewrite/open-questions.md](.harness/plans/261019-1050-jss-devtools-rewrite/open-questions.md).
Ask a question when the plan reaches the step it blocks, never in a batch up front.

The repository-harness block at the end of this file is managed by `jss-devtools harness update`;
do not edit it by hand.

<!-- HARNESS:BEGIN -->

# Repository harness

The code, tests and CI are the authority. `.harness/` records what agents learned about working
with them. Read an index first, then only the file the task needs.

## Where knowledge goes

| Kind                                    | Write to                                                     | Start from                       |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| Fact, trap, convention, user correction | one line in `.harness/MEMORY.md`                             | its header                       |
| Topic longer than a line                | `.harness/docs/<topic>.md`, and a memory line pointing to it | `.harness/docs/README.md`        |
| User decision                           | `.harness/decisions/NNNN-<slug>.md`, quoting the user        | `.harness/templates/decision.md` |
| Reusable procedure                      | `.claude/skills/<name>/SKILL.md`, a learned skill            | `.harness/templates/skill.md`    |

- Add or remove the row in the folder's `README.md` in the same change as the file.
- Learned skills are yours to create, patch and archive without asking; use one when it matches the
  task, patch it when it is wrong.
- Never write a secret. Name the variable or file that holds it.
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.
- AgentKit owns `.harness/{docs,plans}/`: follow its skills there. It also works in `.harness/decisions/`.

## Match the process to the work

- Question, review, diagnosis: read only, answer with evidence, change nothing.
- Bounded change: read the affected code and tests, make the smallest change, run the checks.
- Work spanning sessions: a plan, as the skill that owns the plan folder says.

## Hooks

Session start injects memory and the decisions in force. When the Stop hook asks for a review, run
the `harness-review` skill.

## Decisions

- `.harness/decisions/` is the only product policy. Memory and code defaults are not policy.
- Stop and ask before a change that sets policy no decision covers (limits, permissions, API
  contracts, data retention, pricing), or when intent is unclear, recovery is hard, or the change
  weakens tests, security or compatibility. Give the options and their consequences; do not pick.
  Record the answer as a decision.
- When a request contradicts a decision, name the decision first. Never edit an accepted decision:
  write a new one that supersedes it.

## Done means proven

Claim done only with commands you ran and output you saw. Report what changed, how you checked it,
what you did not check, and what harness knowledge changed. Commit harness changes with the work;
the harness never commits.
<!-- HARNESS:END -->

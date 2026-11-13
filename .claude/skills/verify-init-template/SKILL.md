---
name: verify-init-template
description: >
  Prove a template-generated project (templates/nest/, future framework templates) on pnpm,
  npm, yarn 1 and bun: build the scratch harness with the shared toolchain, run the checks
  and the serve proof, without polluting the repository. Use when a plan phase must prove a
  template installs, lints, typechecks, builds, tests and serves, or when re-proving after
  template or toolchain changes.
metadata:
  harness-origin: learned
  harness-pinned: 'false'
---

# Verify an init template project

## Prefer the real CLI first

Since the nest preset is wired into init (plan 261112-1647), the fast path needs no donor: build and
run `node dist/cli.mjs init <dir> --framework nest --pm <pm> -y` — init itself merges the template
and the shared toolchain. `tests/init-nest.e2e.test.ts` automates this per manager (gated by
`INIT_E2E=1`). The donor procedure below is only for proving a raw template against an older bundle,
or a template init does not wire yet.

## Harness setup (per manager, fresh copy; donor path)

1. Build the CLI and generate the toolchain donor once, outside the repo:
   `pnpm build && node dist/cli.mjs init scratch-node -y` in a scratchpad directory
   (`~/.claude/projects/<project>/scratchpad/<topic>/`). Never scratch in /tmp or the repo.
2. Copy the template into the manager's scratch dir with rsync **excluding** `node_modules` and
   `dist`. Guard every variable before a `--delete` rsync (`test -n "$VAR"`); an unset source
   variable makes rsync copy from `/`.
3. Overlay the shared toolchain files from the donor AFTER the rsync, never before — a
   `--delete` sync wipes them: `.prettierrc.json`, `.editorconfig`, `.prettierignore`,
   `.gitignore`, `commitlint.config.mjs`, `.husky/`, `.vscode/`.
4. Merge the shared devDependencies (`NODE_PRESET_DEPENDENCIES`) into the scratch
   `package.json`; the template holds only its own deps. A bare install fails at
   `prepare: husky` before the merge (chicken-egg). The constant mixes quoted and bare keys, so a
   `'x': 'v'`-only regex matches 13 of 19 and husky fails again — match
   `(?:'([^']+)'|([A-Za-z_$][\w$]*)): '([^']+)'` and assert the pair count.
5. pnpm only: `minimumReleaseAge` policy may reject packages younger than the cutoff; pnpm
   writes `minimumReleaseAgeExclude` entries into `pnpm-workspace.yaml` on a fresh resolution.
   Entries must be quoted (`"@pkg@version"` — a bare `@` cannot start a YAML scalar). Deleting
   the lockfile and reinstalling re-adds them.

## Checks (each manager)

`install` → `lint` → `typecheck` → `test` → `test:e2e` → `build` → `prettier --check .`, then
the serve proof: `APP_PORT=<free port> NODE_ENV=prod node dist/main.js`, curl the health route
(`/health/ready`, unprefixed) for 200 and its `{ status, message, data }` envelope,
`/api/v1/courses` for 200, an unknown route inside `/api` and one outside it with `?lang=vi` for a
Vietnamese 404 served as JSON (decision 0051), one request carrying `x-request-id` and `authorization` to prove reuse and
redaction, and confirm the health route is silent in the request log. Kill the server and
`lsof -i :<port>` before trusting
the result — a stale server from another shell session answers otherwise (`kill %1` does not
reach it).

## Folding fixes back

Run `lint:fix` in the scratch, then rsync the fixes back excluding every scratch-only file
(toolchain, `pnpm-workspace.yaml`, `*.log`, `*.tsbuildinfo`, `serve.pid`). Verify the template
contains no build artifacts afterwards.

## Manager notes

- yarn 1: `yarn install` plain — flags like `--frozen-lockfile=false` break it. husky warns
  ".git can't be found" outside a git repo; real init'd projects are git repos.
- bun: `bun run <script>`; no overrides found so far.
- npm: no overrides found so far.

---
phase: 2
title: "Fuller ignore files"
status: pending
priority: P3
effort: "2h"
dependencies: []
---

# Phase 2: Fuller ignore files

## Input

> "Khi dùng jss-devtools gen ra scaffold codebase, tôi thấy content của .prettierignore, .gitignore
> có vẻ chưa ổn / chưa đủ theo cảm giác của tôi. Tôi mong muốn file ignore bao gồm đầy đủ các case,
> không overengineer nhưng cover hầu hết các case trong ecosystem của nodejs." (user, 2026-11-02)

The user points to the lint glob in `package.json` as the model of scope: it names the
conventional folder names once (`src`, `lib{,s}`, `bin{,s}`, `script{,s}`, `tool{,s}`,
`config{,s}`, `type{,s}`, `test{,s}`, `__test{s,}__`, `spec{,s}`, `e2e`) so that most projects are
covered without per-project tuning. The ignore files get the same treatment: one line per common
case, grouped, no framework-specific sprawl.

## Two facts that shape the design

- Prettier 3 reads `.gitignore` too: "Prettier will also follow rules specified in the
  ".gitignore" file if it exists in the same directory from which it is run", and it skips
  `node_modules` itself (`https://prettier.io/docs/ignore`, read 2026-11-02). So `.prettierignore`
  lists only what is **committed** but must not be formatted, and repeats nothing from
  `.gitignore`.
- The harness commits `.harness/bin/harness-hook.mjs` and `.harness/bin/hooks.mjs` (a bundled
  file), and `harness doctor` compares them with their manifest hash. The scaffold's
  `format` script runs `prettier --write .`, which would rewrite them and break the hash check.
  They must be in `.prettierignore`. Whether the harness's managed Markdown files are stable under
  Prettier is checked in the steps below, not assumed.
- Nothing under a lint-glob source folder (`lib/`, `bin/`, `types/`, …) may be ignored: those are
  source in this scaffold.

## Target `.gitignore`

Grouped, with a blank line between groups; keep the existing `.vscode` negations.

| Group               | Entries                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencies        | `node_modules/`, `.pnpm-store/`, `.yarn/*` with `!.yarn/patches`, `!.yarn/plugins`, `!.yarn/releases`, `!.yarn/sdks`, `!.yarn/versions`, `.pnp.*`               |
| Build output        | `dist/`, `build/`, `out/`, `.output/`, `*.tsbuildinfo`, `*.tgz`                                                                                                 |
| Framework and tools | `.next/`, `.nuxt/`, `.svelte-kit/`, `.astro/`, `.turbo/`, `.vercel/`, `.netlify/`, `storybook-static/`                                                          |
| Tests and coverage  | `coverage/`, `.nyc_output/`, `playwright-report/`, `test-results/`, `blob-report/`                                                                              |
| Caches              | `.cache/`, `.parcel-cache/`, `.eslintcache`, `.stylelintcache`                                                                                                   |
| Logs and runtime    | `logs/`, `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`, `pnpm-debug.log*`, `lerna-debug.log*`, `*.pid`, `*.pid.lock`                          |
| Environment         | `.env`, `.env.*`, `!.env.example`                                                                                                                                |
| Temporary           | `tmp/`, `temp/`                                                                                                                                                  |
| Editors             | `.vscode/*` with `!.vscode/settings.json`, `!.vscode/extensions.json`, `!.vscode/launch.json`, `!.vscode/tasks.json`; `.idea/`, `.history/`, `*.swp`, `*.swo`, `*~` |
| OS                  | `.DS_Store`, `._*`, `Thumbs.db`, `desktop.ini`                                                                                                                   |

`.env*` becomes `.env` and `.env.*`, so `.envrc` and other files that merely start with `.env` are
not swept in by accident; `.env.example` stays committed.

## Target `.prettierignore`

Only committed files Prettier must not touch:

- lockfiles: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`;
- Yarn's committed releases and plugins: `.yarn/`;
- the harness's committed scripts: `.harness/bin/`;
- `CHANGELOG.md` is **not** added (no changelog tool in the scaffold).

Everything the current file repeats from `.gitignore` (`node_modules/`, `dist/`, `coverage/`,
`.env*`, `.eslintcache`, `*.log`) is removed.

## Files

- `src/commands/init/templates/gitignore.template.ts`
- `src/commands/init/templates/prettierignore.template.ts`
- Tests and snapshots that print these files (`grep -rn "eslintcache\|pnpm-lock.yaml" tests`).
- `docs/` only if a doc lists the ignore entries.

## Steps

1. Write both templates as above.
2. Add a test that `.prettierignore` repeats no entry of `.gitignore`, and one that no `.gitignore`
   entry names a lint-glob source folder.
3. Update snapshots that print the files.
4. In a temp folder outside this repository: `init -y` (with the harness), then in the generated
   project run `pnpm format` twice and `git status --porcelain`; then `jss-devtools harness doctor`.
   Expected: the second `format` changes nothing, and doctor reports no `differs from the manifest
   hash` error. If a managed harness Markdown file changes under Prettier, stop and report it with
   the diff: the fix (a Prettier-stable template or one more ignore line) is a planner decision.
5. Full gate.

## Acceptance

- The generated `.gitignore` and `.prettierignore` match the targets above.
- Step 4 holds: formatting a fresh scaffold is idempotent and leaves the harness healthy.
- The two new tests pass.

## Risk and rollback

Template text only; revert the commit. Existing generated projects are not touched.

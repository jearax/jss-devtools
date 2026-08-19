# Project Roadmap — `jss-devtools`

Phased delivery. Each phase is shippable; later phases layer on top.

## Phase 0 — Bootstrap (current)

**Goal:** Establish project context, docs, repo conventions.

**Status:** in progress.

**Deliverables (DONE):**
- [x] Git initialized + remote configured
- [x] `README.md` written
- [x] `docs/` initialized (PDR, architecture, standards, deployment, roadmap, summary)

**Deliverables (TODO):**
- [ ] `package.json` (name, bin, engines, scripts)
- [ ] `tsconfig.json` (strict + ESM)
- [ ] `vitest.config.ts`
- [ ] `.gitignore`, `.npmignore`, `.editorconfig`, `.nvmrc`
- [ ] First commit after Phase 0 close

## Phase 1 — Skeleton CLI

**Goal:** Runnable empty CLI with `--help`, `--version`, command tree.

**Deliverables:**
- [ ] Pick build/bundler (research conclusion on tsup / tsdown / esbuild)
- [ ] `src/cli/router.ts` — command parser
- [ ] `src/commands/version.ts` — `jss-devtools version`
- [ ] `src/commands/help.ts` — top-level + per-subcommand help
- [ ] Vitest setup + 1 smoke test
- [ ] CI workflow (lint + typecheck + test)
- [ ] `npm pack` succeeds

**Exit criteria:**
- `node ./dist/bin/jss-devtools.js --help` prints help
- `node ./dist/bin/jss-devtools.js --version` prints version
- CI green

## Phase 2 — MVP Commands

**Goal:** Ship MVP command set.

**Deliverables:**
- [ ] `ls` command (list installed/available packages)
- [ ] `update` command
- [ ] `upgrade` command (with `--major`/`--minor`/`--patch`)
- [ ] `downgrade` command
- [ ] `core/registry-client/` — npm registry HTTP client
- [ ] `core/version-resolver/` — semver logic
- [ ] Tests for each command
- [ ] `--json` output flag on all commands

**Exit criteria:**
- All MVP commands functional
- Test coverage ≥ 80% on `core/`
- README updated with command examples

## Phase 3 — Scaffolding

**Goal:** `scaffold init` works end-to-end.

**Deliverables:**
- [ ] `scaffold` subcommand tree
- [ ] `core/scaffold-engine/` — template render + write
- [ ] At least one preset (e.g. `ts-lib`, `node-cli`, `ts-svc`)
- [ ] Tests for scaffold flow
- [ ] Documentation for adding custom presets

## Phase 4 — Public Launch

**Goal:** `0.1.0` on npm public registry.

**Deliverables:**
- [ ] LICENSE file
- [ ] GitHub Release notes
- [ ] npm publish with provenance
- [ ] Install instructions verified
- [ ] GitHub repo metadata (description, topics, homepage)

## Phase 5+ (Future)

- Plugin system
- Workspace / monorepo awareness
- TUI mode
- Auto-update of CLI itself
- Hooks / events surface

## Tracking Conventions

- Each phase becomes a plan in `plans/{date}-phase-{N}-{slug}/`
- Reports land in `plans/reports/`
- Roadmap updates when scope or phase order changes
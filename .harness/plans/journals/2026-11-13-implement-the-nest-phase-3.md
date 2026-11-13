---
title: Implement the nest phase 3
date: 2026-11-12
summary: "Wired init --framework nest: new nest-plan.service, nest rejected in existing mode, node output byte-unchanged; full checks green"
---

# Implement the nest phase 3

## What happened

Implemented phase 3 of plan 261112-1647-init-nest-preset (init wiring for the nest preset):

- New `src/commands/init/services/nest-plan.service.ts` (109 lines): `nestCreateModeEntries` and `nestMonorepoAppEntries`. Only `package.json` is transformed (name `nest-app` → derived package name, 19 shared devDependencies merged as carets); all other embedded template files are copied byte-for-byte.
- Dispatch-only edits: `plan.service.ts` (create-mode nest branch), `monorepo-plan.service.ts` (app-entries nest branch, root files untouched), `init.command.ts` (`--framework` description + one example row).
- `init.service.ts`: nest accepted with `<dir>`; nest without `<dir>` throws `Framework nest needs <dir>` naming the create command; react hint updated to `Only node and nest are`.
- `templates/nest/package.json`: added `dev: nest start --watch` so the outro's `<pm> run dev` maps to Nest's watch server.
- Tests: +11 (nest plans per manager, name substitution, existing-mode rejection, two dry-run writes-nothing, error-output block); help snapshots updated in three test files (init.command HELP_BLOCK, bundle.test.ts, help-colours padding).

## Decision

- Kept the plan's letter: no `packageManager` field added to the nest manifest, `format` script stays `npm run lint:fix && ...` from the template, engines stays the template's `>=24.11.0` (equals PACKAGE.nodeFloor today).
- Monorepo root files stay "as for node" per the phase doc; the root ESLint (.js-banning) vs nest (.js-requiring) conflict is recorded in the phase 3 report as phase 4's verification item, not silently fixed.

## Facts worth keeping

- Bundle grew 344,709 → 376,543 bytes (+31,834): embedded template content is 26,372 bytes; the phase-2 "~116 kB" estimate was du including node_modules.
- Scratch proof (real built CLI): `init my-api --framework nest --pm pnpm -y` exit 0, install/lint/typecheck/test(8)/test:e2e(7)/build/prettier --check all green, no `minimumReleaseAgeExclude` added; single and monorepo dry-runs write nothing; existing mode + nest exits 1 before any write.
- Long markdown Writes garbled twice (junk rows in tables); small Edits after a Read fixed it — check every generated file with grep before trusting it.

## Next steps

- Phase 4 (e2e and docs): prove nest per manager from the real CLI, resolve the root-vs-app ESLint glob question in nest monorepo, re-check site init transcripts for the changed help output.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

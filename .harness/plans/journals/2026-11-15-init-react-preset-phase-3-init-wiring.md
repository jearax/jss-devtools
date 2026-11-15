---
title: "init react preset phase 3: init wiring"
date: 2026-11-15
summary: Wired --framework react into init create and monorepo modes; extracted shared plan helpers so the nest output stayed byte-identical
---

# init react preset phase 3: init wiring

## What happened

Implemented phase 3 of .harness/plans/261115-0643-init-react-preset: `init <dir> --framework react` plans the Vite React app in create mode, `--monorepo` puts it at apps/react named @<project>/react. The argument rules in init.service.ts now group nest+react as needing <dir>, and the "not supported yet" case moved to rn/next with hint "Only node, nest and react are". --no-sample stays nest-only.

Key change: shared-template-plan.service.ts now owns planEntry, sharedDevDependencies (NODE_PRESET_DEPENDENCIES minus tsx/tsc-alias) and templateManifest, imported by both nest-plan.service.ts (rewritten, diff = pure extraction) and the new react-plan.service.ts. react-plan.service.ts substitutes <title>react-app</title> in index.html with a throw-on-missed-match guard, mirroring the nest CourseModule-drop pattern.

Verification: pnpm lint/typecheck/test/build all exit 0 (602 tests). dist/cli.mjs grew 452,975 -> 489,500 bytes; grep -c createAppRouter = 2; check added to tests/bundle.test.ts. Both --dry-run outputs (87 and 92 to create, nothing written) captured in the report.

## Failure archaeology

Session-level trap: long Write/Edit/heredoc tool calls kept getting corrupted mid-content (duplicated import blocks, "sample: single", 'yarn' | 'npm', instruction text injected as code). Known repo trap confirmed again; recovery was small anchored Edits plus re-reading after every write, and one big test block was redesigned (template paths derived from REACT_TEMPLATE_FILES keys instead of a 47-line hardcoded list) to shrink the write size. Two self-inflicted plan-test failures: forgot commitlint.config.mjs and the root eslint.config.mjs in the expected toolchain lists.

## Decision

reactMonorepoAppEntries takes only preflight (no options): react has no --no-sample, so the dispatch drops the second argument rather than keeping an unused parameter.

## Next steps

Phase 4 (e2e per manager, INIT_E2E=1, memo_cache_sentinel compiler proof, site and docs) is pending planner review of this phase. prettier --check on a freshly generated project is not yet proven on a real install.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

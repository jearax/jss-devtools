---
title: Fix the two stale init e2e tests
date: 2026-11-12
summary: "Both INIT_E2E tests were stale against decisions 0031/0035; fixed test-only, roadmap Known bullet removed, not committed."
---

# Fix the two stale init e2e tests

## What happened

`tests/init.e2e.test.ts` had two stale tests, causes already proven before this session:

1. `runs ak init with --agent-kit…` compared `listInitFiles` against `HARNESS_FILES`, built from `harnessInstallEntries` with `agentKit: false`. Under AgentKit (7c075ab, decision 0035) `.harness/plans/README.md` is a `seed`, so it is absent from `.harness/core/base/` and the path lists diverge.
2. `sets up the project again in existing mode…` copied `my-app-pnpm`, which already carries the harness, so the first existing-mode `init -y` exited 1 `Already set up` (decision 0031), while the test expected the pre-9af57ab message `already exist`.

## Decision

Test-only fix, product code untouched:

- Added `AGENT_KIT_HARNESS_FILES` from `harnessInstallEntries` with `agentKit: true` (same shape as `HARNESS_FILES`; the create-mode tests keep `agentKit: false`) and pointed the `--agent-kit` expectation at it.
- The existing-mode copy now removes `.harness`, `.claude`, `CLAUDE.md` alongside the owned configs, so the first `init -y` sets up toolchain and harness; the second run asserts exit 1 with stderr containing `Already set up`; the `-f` run stays.

## Verification

- `INIT_E2E=1 pnpm vitest run tests/init.e2e.test.ts` — 7/7 passed (bun 4.4s, pnpm 8.3s, yarn 23.8s, npm 6.9s, plus `--no-harness`, `--agent-kit`, existing mode), all four managers on PATH.
- `pnpm lint`, `pnpm typecheck`, full `pnpm test` (498 passed, 11 skipped) — all exit 0.
- Removed the `Known: tests/init.e2e.test.ts has two failures…` bullet from `.harness/docs/project-roadmap.md`.

## Trap worth keeping

`INIT_E2E=1 pnpm test -- tests/init.e2e.test.ts` did not filter and did not enable the e2e gate: it ran the whole 33-file default suite with the e2e skipped, exit 0, looking green. Only `INIT_E2E=1 pnpm vitest run tests/init.e2e.test.ts` (the form the test file's own comment documents) ran the real thing. Verify which tests actually ran; an exit 0 from the wrong invocation proves nothing.

## Next steps

- Nothing open. Changes left uncommitted per instruction.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

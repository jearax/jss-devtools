# Phase 3 — Implementation (`jss-devtools init`)

Status: in progress (bắt đầu 2026-08-30 23:07, user đã duyệt Phase 1 + 2) | Input: phase-01 (surface) + phase-02 (flow)

## Implementation order

1. **Surface + negation verify:** `src/commands/init.ts`, `init/types.ts`, `init/utils/args.ts`, router registration. Unit test `extractInitArgs` + citty `--no-*` keying (open item #1) — viết test TRƯỚC khi viết flow.
2. **Core detectors:** `core/detector/project-pm.ts`, `core/detector/monorepo-signals.ts`, `core/runner/pm-runner.ts` + unit tests (verify nypm API surface trong lúc viết — open #2).
3. **Presets:** `init/presets/{types,node-preset,react-preset,next-preset}.ts` (eslint pkgs, tsconfig shape, globs, runtime deps — resolve versions peer-aware, open #3/#4).
4. **Generators:** `init/generators/*.ts` (eslint/prettier/commitlint/tsconfig/husky-hooks/lint-staged content builders, pure) + snapshot tests.
5. **Plan:** `init/plan/{types,compute-plan,conflicts}.ts` + unit tests (framework × flag matrix).
6. **Manifest:** `init/utils/manifest.ts` (read/patch/write preserve fields, skip existing scripts, không đụng user deps) + tests.
7. **Install:** `init/install/{resolve-specs,build-install-commands}.ts` (registry-client + peer-aware + per-PM commands) + tests (mock fetch).
8. **Orchestrator:** `init/run-init-flow.ts` (6 stages theo phase-02 §3) — wiring detector→plan→confirm→apply→install→verify→result.
9. **Integration tests:** temp-dir full flow per framework **node → react → next** (mock install exec), idempotent re-run, --dry-run zero-mutation, --no-* paths, conflict paths, abort paths, non-TTY+conflict exit 1.
10. **Quality gates:** eslint, tsc --noEmit, build, full vitest.
11. **Manual campaign (user gate):** scratch dir per mode: real install + real commit (message sai convention → commitlint chặn; đúng → lint-staged chạy).

## Constraints

- Tuân thủ code-standards: kebab-case, no barrels, `@/` alias + `.js` ext, why-comments, strict TS no `any`, <200 LOC/file.
- Deps mới của CLI: KHÔNG thêm runtime dep mới trừ khi design yêu cầu (design chỉ dùng deps hiện có: citty, execa, nypm, pathe, @clack/prompts, consola, semver).
- Mọi exit path qua `CommandResultStatus` convention; stdout chỉ JSON.
- win32: skip chmod (open #7). Dry-run offline: spec placeholder `latest` + warn (open #6).

## Validation

- [ ] Unit + integration xanh toàn bộ (vitest run)
- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm build` sạch
- [ ] Manual campaign 3 modes user confirm

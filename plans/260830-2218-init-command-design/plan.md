# Plan — `jss-devtools init` command

Created: 2026-08-30 22:18 | Revised: 2026-08-30 22:35 (user surface review) | Status: **in progress** | Branch target: `main`

## Goal

`jss-devtools init` khởi tạo full dev-tooling trên project JS/TS có sẵn: git + husky hooks, lint-staged, ESLint flat config, Prettier (+ `prettier-package-json` qua PM runner), commitlint `config-conventional` default rules, TypeScript config + path alias `@/*`, package.json scripts, dependencies đặt đúng chỗ (deps/devDeps/peerDeps/peerDependenciesMeta). Framework-aware (**node/react/next** — react-native out of scope per user 22:35), PM-aware (npm/yarn/pnpm/bun), idempotent.

## Phases

| Phase | File | Status | Gate |
|---|---|---|---|
| 1 — Command surface design (args/flags/help) | [phase-01-command-surface.md](phase-01-command-surface.md) | approved 22:52 (với revision framework-required) | Done |
| 2 — Flow design theo args/flags | [phase-02-flow-design.md](phase-02-flow-design.md) | in progress | User duyệt trước khi implement |
| 3 — Implement + test 3 modes | `phase-03-implementation.md` | pending | Manual-test gate theo thứ tự node → react → next |

## Key decisions (locked)

1. **Surface (revised user 22:35 + 22:52):** single `init` command, **7 args**: `--framework <node|react|next>` (**required**, không auto-detect — user 22:52) · `-y,--yes` · `--dry-run` · `--json` · `--no-linter` · `--no-commitlint` · `--no-install`. Không flag cho git/husky/lint-staged/typescript/scripts — always-on, điều khiển bằng detection. `--no-linter` gộp eslint + prettier. `--no-*` boolean negation (citty v0.2.2 verified: parser gom `negatedFlags`, help tự in `--no-<name>` khi `default: true`).
2. **Framework enum: `node|react|next`** (user 22:35) — react-native out of scope, không detect framework (user 22:52).
3. **TypeScript + alias `@/*` + scripts luôn gen** (user: "gen mặc định, giả sử user đã có project TS") — không opt-out. Scripts = `prepare: "husky"` + `format: "eslint --fix <globs> && prettier --write <globs>"` theo refs (user 22:52).
4. **Git theo detect, silent:** chưa có `.git` → `git init -b main` silent; đã có → silent noop. Không noise (user 22:35).
4b. **`--no-linter` interplay (approved 22:52):** skip pre-commit hook, không gen lint-staged rỗng; giữ husky + commit-msg nếu commitlint on.
5. **Không có flag `--pm`** (user từ chối) — PM chỉ do detection + prompt (TTY). Non-TTY + detection không rõ → error exit 1.
6. **Monorepo:** detect (pnpm-workspace.yaml / `workspaces` / `workspace:*`) → abort `error` exit 1 + hint. Không `--force`. (kongming)
7. **`prettier-package-json`:** runner-only, không cài dep (nguyên văn yêu cầu user). Lời gọi runner pin semver range (`prettier-package-json@^2.8.0`) resolve qua registry-client. Map: npm→`npx --yes`, pnpm→`pnpm dlx`, bun→`bunx`, yarn berry→`yarn dlx`, yarn v1→fallback `npx --yes`. Thuộc feature `linter` (off khi `--no-linter`).
8. **Deps placement:** tooling (eslint*, prettier*, husky, lint-staged, commitlint, typescript, tsc-alias) → `devDependencies` luôn. Framework runtime (react, react-dom, next): app (`private: true`) → `dependencies`; library (non-private + `exports`/`types`) → `peerDependencies` + bản copy `devDependencies` cho dev local; `peerDependenciesMeta` chỉ khi optional thật. Không đụng dep user đã khai báo.
9. **Version strategy:** caret ranges resolve latest stable qua registry-client có sẵn, không hard-pin.

## Evidence

- Scout report: [`plans/reports/scout-260830-2207-init-command-design.md`](../reports/scout-260830-2207-init-command-design.md)
- Kongming counsel (advisory, adopted trừ `--pm` — user override): GO Approach A; `--no-*` thay `--skip`; monorepo abort; ppj pin range; deps placement split tooling/runtime; top-3 Phase-2 risks (conflict matrix, PM detection order, husky v9 wiring).
- Kongming Phase-2 go/no-go: [`plans/reports/kongming-260830-2257-init-phase2-gonogo.md`](../reports/kongming-260830-2257-init-phase2-gonogo.md) — GO; fixes đã áp vào phase-02: prepare-lifecycle note, hooksPath warning, pm-add-writes-deps, Keep giữ core linter deps, tsconfig solution-style guard + paths không cần baseUrl, InitResult thêm `conflicts`, PM exec map đầy đủ, peer-aware version resolution (top risk).

## Acceptance criteria (plan-level)

- [ ] `jss-devtools init --framework <node|react|next> --yes` gen đầy đủ artifacts đúng framework, hooks chạy thật, install qua detected PM, idempotent re-run.
- [ ] `--dry-run` in plan, không mutate fs/exec. `--json` structured result. Non-TTY an toàn.
- [ ] Integration tests temp-dir per mode; manual test theo thứ tự node → react → next.

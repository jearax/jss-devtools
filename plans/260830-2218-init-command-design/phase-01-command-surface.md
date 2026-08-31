# Phase 1 — Command Surface Design (`jss-devtools init`)

Status: revised per user review 2026-08-30 22:35 | Prereq: scout report + kongming counsel + user decisions

## 0. Revision log

- **2026-08-30 22:52 (user):** bỏ framework auto-detection → `--framework` REQUIRED. Approve: `--no-linter` → skip pre-commit hook. Default scripts chốt: `prepare` + `format` (nội dung theo refs).
- **2026-08-30 22:35 (user):** bỏ `--no-git` (git xử lý theo detect, silent), bỏ `--no-husky` + `--no-lint-staged` (luôn có), gộp `--no-eslint` + `--no-prettier` → `--no-linter`, bỏ `--no-typescript` + `--no-scripts` (TS + alias `@` + default scripts luôn gen), `--framework` thu hẹp còn `node|react|next` (react-native out of scope).
- **2026-08-30 22:18 (user):** TS default ON mọi project; không thêm `--pm`.
- **2026-08-30 22:07 (kongming):** GO single-command option A; `--no-*` negation (citty verified); monorepo abort; ppj runner-only pin range; deps placement split tooling/runtime.

## 1. Command shape

```
jss-devtools init [options]
```

- Leaf command tại `src/commands/init.ts`, đăng ký lazy trong `src/cli/router.ts`:
  `init: () => import('@/commands/init.js').then(m => m.default)`
- Không positional arg. Không subcommand. `run` chỉ làm 2 việc: `extractInitArgs(args)` → `runInitFlow(initArgs)` (flow là Phase 2).

## 2. Args schema (citty `defineCommand.args`) — 7 args

### 2.1 Selection arg

| Arg | Type | Default | Mô tả |
|---|---|---|---|
| `framework` | enum string | **required** | `node` \| `react` \| `next`. KHÔNG auto-detect (user 22:52). Absent → structured error `FRAMEWORK_REQUIRED` (message liệt kê 3 giá trị), exit 1. Invalid value (kể cả `react-native`) → `FRAMEWORK_INVALID`, exit 1. |

### 2.2 Mode args (repo universal convention)

| Arg | Type | Default | Mô tả |
|---|---|---|---|
| `yes` (`-y`) | boolean | `false` | Skip mọi prompt, dùng defaults (conflict → auto-Replace, PM → detection result). |
| `dry-run` | boolean | `false` | Compute + print full plan (files, edits, install cmd). Không mutate fs, không exec PM. |
| `json` | boolean | `false` | Structured result ra stdout; logs vẫn stderr. JSON mode auto-default các confirmation (như `-y`) theo convention `confirmOrCancel` hiện có. |

### 2.3 Feature opt-out args — boolean, `default: true`

| Arg (dùng dạng `--no-<arg>`) | Bỏ qua điều gì |
|---|---|
| `linter` | Toàn bộ formatter/linter stack: eslint flat config + plugins, `.prettierrc.json`, `.prettierignore`, prettier-package-json wiring, `lint`/`format` scripts |
| `commitlint` | `commitlint.config.mjs` + `@commitlint/cli` + `@commitlint/config-conventional` (default rules) + commit-msg hook |
| `install` | Bỏ bước chạy PM install — vẫn ghi configs + cập nhật package.json deps fields |

### 2.4 Always-on behaviors — KHÔNG có flag, điều khiển bằng detection (user quyết định)

| Behavior | Logic |
|---|---|
| **git** | Detect `.git`: chưa có → `git init -b main` silent; đã có → silent noop. Không output noise cả 2 trường hợp. |
| **husky** | Luôn install + wiring hooks. |
| **lint-staged** | Luôn gen config + devDep (khi còn ít nhất 1 task chạy được — xem §2.5). |
| **typescript + alias** | Luôn gen tsconfig + path alias `@/*` (giả sử project là TS — user decision). |
| **scripts** | Luôn gen `prepare` + `format` (user 22:52, nội dung theo refs). `prepare: "husky"`. `format: "eslint --fix <globs> && prettier --write <globs>"` — globs theo framework preset (Phase 2). `--no-linter` → không gen `format`. |

### 2.5 Interplay đã duyệt (user 22:52)

- `--no-linter` → **skip pre-commit hook** (không còn task linter nào để chạy). Giữ husky install + commit-msg hook nếu commitlint on. Không gen lint-staged config rỗng.
- Hệ quả: `--no-linter --no-commitlint` → husky được install nhưng 0 hooks (vô hại, ghi nhận trong result `skipped`).
- lint-staged config chứa: globs code → `["eslint --fix", "prettier --write"]` + entry `package.json` → ppj runner (theo jss-devtools repo convention, nhưng gọi qua PM runner thay vì local binary).

## 3. Types (`src/commands/init/types.ts`)

```ts
export type FrameworkId = 'node' | 'react' | 'next'

// Toggleable features (default true, opt-out qua --no-*)
export type InitFeatureKey = 'linter' | 'commitlint' | 'install'

export interface InitFeatures {
  linter: boolean
  commitlint: boolean
  install: boolean
}

export interface InitArgs {
  framework: FrameworkId   // required — không auto-detect (user 22:52)
  yes: boolean
  dryRun: boolean
  json: boolean
  features: InitFeatures
}
```

## 4. Arg extraction contract (`src/commands/init/utils/args.ts`)

Theo pattern `src/commands/self/utils/args.ts` (extractor thuần, không side effect):

```ts
export function extractInitArgs(raw: Record<string, unknown>): InitArgs
```

- Feature default-on: `enabled = raw[name] !== false` (bất tử với thứ tự key, đúng với citty negation). Cả 3 feature key đều single-word → không cần kebab→camel map.
- `dryRun = raw['dry-run'] === true`; `yes = raw['yes'] === true`; `json = raw['json'] === true`.
- `framework`: absent → throw structured error `FRAMEWORK_REQUIRED`; present + ∉ `['node','react','next']` → throw `FRAMEWORK_INVALID` (message liệt kê 3 giá trị hợp lệ) → command bắt → result `error`, exit 1.

## 5. File layout (Phase 1 scope — chỉ scaffold surface)

```
src/commands/
├── init.ts                    # defineCommand leaf: meta + args + run → runInitFlow
└── init/
    ├── types.ts               # FrameworkId, InitFeatureKey, InitFeatures, InitArgs
    └── utils/
        └── args.ts            # extractInitArgs + FRAMEWORK_INVALID validation
```

Phase 2 sẽ thêm (không thuộc Phase 1): `src/core/detector/project-pm.ts`, framework detector, generators (eslint/prettier/commitlint/tsconfig/husky/lint-staged/scripts), install planner — theo boundary "core không phụ thuộc CLI".

## 6. Help (`jss-devtools init --help`)

```
jss-devtools init — initialize dev tooling on an existing project

Usage: jss-devtools init [options]

Options:
  --framework <framework>   (required) node | react | next
  -y, --yes                 skip prompts, accept defaults
  --dry-run                 print the plan without writing or installing
  --json                    output structured JSON result
  --no-linter               skip eslint + prettier setup
  --no-commitlint           skip commitlint (config-conventional)
  --no-install              write configs but skip dependency installation

Always included: git (silent), husky, lint-staged, tsconfig + '@' alias,
scripts: prepare (husky) + format (eslint --fix && prettier --write).

Examples:
  jss-devtools init --framework node       # node preset, interactive confirms
  jss-devtools init --framework next -y    # non-interactive, Next.js preset
  jss-devtools init --framework react --dry-run --json
```

## 7. JSON result contract (draft — Phase 2 finalize)

```ts
export interface InitResult {
  command: 'init'
  status: CommandResultStatus   // 'success' | 'dry-run' | 'noop' | 'cancelled' | 'error'
  framework: FrameworkId        // luôn set (required flag)
  pm: AgentName | null
  generated: string[]           // relative paths written
  modified: string[]            // files edited (vd package.json)
  installed: string[]           // specs added (chưa chắc đã install khi --no-install)
  skipped: Array<{ feature: InitFeatureKey | 'git' | 'husky' | 'lint-staged'; reason: string }>
  dryRun: boolean
  durationMs?: number
}
```

## 8. Exit codes (theo convention hiện có)

| Code | Trường hợp |
|---|---|
| 0 | success / dry-run / noop / cancelled |
| 1 | user error: `FRAMEWORK_INVALID`, monorepo abort, non-TTY cần confirm, PM không detect được (non-TTY) |
| 2 | internal error |

## 9. Acceptance (Phase 1 — verify lúc implement Phase 3)

- [ ] `jss-devtools init --help` exit 0, liệt kê đủ 7 args + examples + always-included note.
- [ ] `jss-devtools init` (không flag) → `FRAMEWORK_REQUIRED` error, exit 1.
- [ ] Unit test `extractInitArgs`: 3 features = true khi flag vắng mặt; `--no-linter` → `linter: false`; `--no-commitlint` → `commitlint: false`; `--no-install` → `install: false`.
- [ ] Unit test: `--framework react-native` và `--framework vue` → `FRAMEWORK_INVALID` error path.
- [ ] Smoke: `jss-devtools init --framework node --dry-run` không fallback `E_UNKNOWN_COMMAND` (init là leaf không positional).

## 10. Carry-forward sang Phase 2 (open)

1. Verify bằng unit test: citty `--no-linter` → key `linter === false` (kongming đọc dist thấy `negatedFlags` — cần test chốt).
2. `nypm` ^0.6.9 có expose dlx mapping không — nếu có thay map thủ công runner (npm→`npx --yes`, pnpm→`pnpm dlx`, bun→`bunx`, yarn berry→`yarn dlx`, yarn v1→fallback `npx --yes`).
3. Non-TTY + PM detection ambiguous → error message shape nào (không có `--pm` escape hatch — user từ chối).
4. Conflict-resolution UX: 1 conflict-summary prompt tổng (kongming) thay per-file.
5. Windows: `.cmd` shim khi spawn runner qua execa.
6. PM detection order: `packageManager` field > lockfile > nypm guess > prompt(TTY)/error(non-TTY).

(Đã đóng 22:52: framework auto-detect — bỏ hẳn; `--no-linter` interplay — skip pre-commit; default scripts — `prepare` + `format`.)

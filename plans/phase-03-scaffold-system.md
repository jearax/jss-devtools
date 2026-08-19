---
phase: 3
title: "Scaffold System"
status: pending
priority: P3
effort: "4h"
dependencies: [2]
---

# Phase 3: Scaffold System

## Overview

`jss-devtools scaffold init [preset]` hoạt động end-to-end với at least 1 preset (`ts-lib`).

## Requirements

- **Functional:**
  - `jss-devtools scaffold init <preset>` — interactive flow: chọn preset + project name → generate project.
  - At least 1 preset hoạt động (`ts-lib`: TypeScript library starter).
  - `.jssrc` file (optional) để customize defaults.
- **Non-functional:**
  - Preset có thể là local (file system) hoặc remote (git URL).
  - Template render support variables (project name, author, etc.).
  - Test coverage cho scaffold flow.

## Architecture

```
src/
├── core/
│   ├── scaffold-engine/        # template render + writer
│   │   ├── index.ts
│   │   ├── load-template.ts
│   │   ├── render.ts
│   │   └── write.ts
│   ├── config-loader/          # .jssrc + env defaults
│   │   ├── index.ts
│   │   └── types.ts
│   └── preset-resolver/        # find preset by name
│       ├── index.ts
│       └── types.ts
├── presets/
│   └── ts-lib/                 # default preset
│       ├── template/
│       │   ├── package.json.hbs
│       │   ├── tsconfig.json
│       │   ├── src/
│       │   │   └── index.ts.hbs
│       │   └── README.md.hbs
│       └── preset.json
└── commands/
    └── scaffold/
        ├── init.ts
        └── types.ts

tests/
├── unit/
│   ├── scaffold-engine.test.ts
│   ├── config-loader.test.ts
│   └── preset-resolver.test.ts
└── integration/
    └── scaffold-init.test.ts
```

## Related Code Files

**Create:**
- `src/core/scaffold-engine/index.ts`
- `src/core/scaffold-engine/load-template.ts`
- `src/core/scaffold-engine/render.ts`
- `src/core/scaffold-engine/write.ts`
- `src/core/config-loader/index.ts`
- `src/core/config-loader/types.ts`
- `src/core/preset-resolver/index.ts`
- `src/core/preset-resolver/types.ts`
- `src/presets/ts-lib/preset.json`
- `src/presets/ts-lib/template/...`
- `src/commands/scaffold/init.ts`
- `src/commands/scaffold/types.ts`
- Tests for each

**Modify:**
- `src/cli/router.ts` (add scaffold subcommand)

## Implementation Steps

1. **Template engine** — choose handlebars hoặc đơn giản string-replace với `{{var}}` syntax.
2. **Writer** — `execa` for git init, `pathe` for cross-platform paths, recursive mkdir.
3. **Config loader** — read `.jssrc` (JSON) từ cwd, fallback to defaults.
4. **Preset resolver** — local preset (under `src/presets/<name>/`) hoặc remote (git URL).
5. **`ts-lib` preset** — minimal TypeScript library starter (package.json, tsconfig, src/index.ts, README).
6. **Interactive flow** — `@clack/prompts` cho preset selection + project name input.
7. **`scaffold init` command** — orchestrate load + render + write + post-init (git init, install).
8. **Integration tests** — run scaffold trong temp dir, verify files + runnable output.

## Success Criteria

- [ ] `jss-devtools scaffold init ts-lib` tạo project mới chạy được (`pnpm i && pnpm build` exit 0).
- [ ] Interactive flow skip khi `--yes` flag.
- [ ] `.jssrc` customization works.
- [ ] Test coverage cho scaffold flow.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Template engine edge cases | Use mature lib (handlebars) thay vì custom |
| Overwrite existing files | Detect + confirm với user |
| Git init failures | Make optional, don't fail scaffold |
| PM install failures | Show clear error, leave files on disk for manual fix |

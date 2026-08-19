---
phase: 1
title: "Core CLI Infrastructure"
status: completed
priority: P2
effort: "2h"
dependencies: [0]
---

# Phase 1: Core CLI Infrastructure

## Overview

Hoàn thiện command router, theme helpers, help system, và `version` command với figlet banner.

**Import rule:** Phase 1+ source code phải dùng `@/` alias cho mọi project import (xem plan.md § Import Convention).

## Requirements

- **Functional:**
  - `--help` / `-h` hoạt động trên mọi subcommand (citty built-in).
  - `version` command in version + optional figlet banner.
  - `consola` wrapper logger với consistent API.
- **Non-functional:**
  - `--json` flag hoạt động trên tất cả commands (return JSON thay formatted).
  - Help text �n định qua snapshot tests.
  - TTY detection để skip prompts trong CI.

## Architecture

```
src/
├── bin/jss-devtools.ts         # entry — runMain(router)
├── cli/
│   ├── router.ts               # top-level citty router
│   └── help.ts                 # custom help rendering (optional override)
├── utils/
│   ├── logger.ts               # consola wrappers
│   ├── banner.ts               # figlet banner với cache
│   └── constants.ts            # CLI_META (name, version, tagline)
└── commands/
    ├── version.ts              # jss-devtools version
    └── help.ts                 # pass-through citty help

tests/
├── unit/
│   ├── logger.test.ts
│   ├── banner.test.ts
│   └── help.test.ts
└── integration/
    └── cli-help.test.ts        # snapshot test
```

## Related Code Files

**Create:**
- `src/cli/help.ts` (custom help command — citty 0.2.x has no custom help render, so we still intercept at top level in cli.ts)
- `src/commands/version.ts`
- `src/commands/help.ts`

**Modify:**
- `src/cli/router.ts` (add version + help subcommands via lazy import)
- `src/cli.ts` (use `renderHelp` helper from `src/cli/help.ts`)
- `tests/smoke.test.ts` (add tests for version + help subcommands)

**Modify:**
- `src/cli/router.ts` (add version + help subcommands)

## Implementation Steps

1. **Logger wrapper** (`src/utils/logger.ts`) — wrap consola với API: `info`, `warn`, `error`, `success`, `box`, `start`, `ready`, `raw` (cho ASCII art). ✅ Done in Phase 0.
2. **Banner utility** (`src/utils/banner.ts`) — figlet textSync với caching + fallback nếu font fail. ✅ Done in Phase 0.
3. **CLI_META constants** (`src/utils/constants.ts`) — name, version, tagline, banner options. ✅ Done in Phase 0.
4. **Router update** (`src/cli/router.ts`) — add `version` + `help` subcommands, lazy import cho future commands.
5. **Help command** (`src/commands/help.ts`) — citty built-in hoặc custom rendering.
6. **Version command** (`src/commands/version.ts`) — print version + optional figlet banner.
7. **Smoke test extension** — extend `tests/smoke.test.ts` với version + help subcommands.

**Note on testing:** Phase 1 chỉ extend smoke tests. Unit/snapshot tests sẽ add ở pre-release phase (xem `docs/code-standards.md` § Testing).

## Success Criteria

- [ ] Mọi subcommand accept `--help` / `-h`.
- [ ] `--json` flag return JSON output.
- [ ] Help text ổn định qua snapshot tests.
- [ ] `jss-devtools version` in version + figlet banner.
- [ ] TTY detection skip interactive flows trong CI.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| consola API drift | Pin version; wrapper insulates API |
| figlet font load fail | Try-catch + fallback to plain text |
| Snapshot tests flake | Pin figlet font version; avoid timing-dependent output |
| Citty --json flag behavior | Check citty docs / test explicitly |

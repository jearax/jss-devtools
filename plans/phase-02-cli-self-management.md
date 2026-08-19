---
phase: 2
title: "CLI Self-Management"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: CLI Self-Management

## Overview

Four commands cho phép `jss-devtools` quản lý chính nó (re-install/uninstall qua package manager đã detect): `update`, `upgrade`, `downgrade`, `uninstall`. Mọi write operation delegate to package manager (npm/pnpm/yarn/bun) — không modify files trực tiếp.

**Architectural pivot (vs original Phase 2 plan):** không quản project's dependencies mà quản CLI itself. Lý do: package manager là source of truth cho install/update/uninstall, CLI không nên bypass.

## Requirements

### Functional

| Command | Description | Behavior |
|---|---|---|
| `jss-devtools update` | Re-install CLI at latest matching version | Call `<pm> add -g jss-devtools@latest` |
| `jss-devtools upgrade` | Re-install CLI at latest major version | Call `<pm> add -g jss-devtools@latest` (same as update unless we add `--no-major` flag) |
| `jss-devtools downgrade` | Re-install CLI at previous published version | Query registry, find previous version, call `<pm> add -g jss-devtools@<prev>` |
| `jss-devtools uninstall` | Remove CLI from global install | Call `<pm> remove -g jss-devtools` |

**All 4 commands require:**
- Detect which PM installed the CLI globally
- Confirm via `@clack/prompts` before applying changes (unless `--yes` flag)
- Output result via `consola` (logger)
- `--json` flag for scripting

### Non-functional

- Network calls có timeout + retry (npm registry query)
- Detect PM works across npm/pnpm/yarn classic/bun
- Test coverage: smoke tests only (per `docs/code-standards.md`); unit tests added pre-release
- All commands work in non-TTY (skip confirm, use `--yes` default behavior or error)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ User: jss-devtools update                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────�
│ Detect installed PM                                              │
│ - exec each: npm ls -g jss-devtools, pnpm ls -g, yarn list,      │
│   bun pm ls                                                      │
│ - First PM that finds jss-devtools = owner                        │
│ - Cache result for session (no repeated detection)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Query registry for versions (downgrade only)                      │
│ - GET https://registry.npmjs.org/jss-devtools                     │
│ - Filter versions list, exclude prerelease + yanked               │
│ - Return sorted latest + previous                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Confirm via @clack/prompts (TTY only)                             │
│ - Show current version + target version                          │
│ - Show command that will run                                     │
│ - require explicit confirmation                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Execute via execa (stdio: inherit)                                │
│ - npm: `npm install -g jss-devtools@<version>`                    │
│ - pnpm: `pnpm add -g jss-devtools@<version>`                      │
│ - yarn classic: `yarn global add jss-devtools@<version>`          │
│ - bun: `bun install -g jss-devtools@<version>`                    │
└─────────────────────────────────────────────────────────────────┘
```

### Module Layout

```
src/
├── core/
│   ├── global-pm-detector/        # detect which PM installed CLI globally
│   │   ├── index.ts
│   │   └── types.ts
│   ├── registry-client/            # npm registry HTTP (existing concept, adapted)
│   │   ├── index.ts
│   │   ├── fetch-package.ts        # get versions list
│   │   └── types.ts
│   └── self-installer/             # execute PM commands for install/remove
│       ├── index.ts
│       └── commands.ts             # per-PM command builders
└── commands/
    ├── self-update.ts
    ├── self-upgrade.ts
    ├── self-downgrade.ts
    └── self-uninstall.ts

utils/
└── prompts.ts                     # shared @clack/prompts wrappers (confirm, select, etc.)
```

### Data Flow per Command

**`update`:**
```
1. global-pm-detector.detect() → { pm: 'pnpm', version: '0.1.0' }
2. registry-client.fetchLatest('jss-devtools') → '0.5.2'
3. prompts.confirm(`Update jss-devtools from 0.1.0 to 0.5.2 via pnpm?`)
4. self-installer.installGlobal('pnpm', 'jss-devtools', '0.5.2')
5. logger.success(`Updated jss-devtools to 0.5.2`)
```

**`downgrade`:**
```
1. detect() → { pm: 'pnpm', version: '0.5.2' }
2. registry-client.fetchVersions('jss-devtools') → ['0.5.2', '0.5.1', '0.4.3', ...]
3. find previous (semver < current)
4. prompts.select({ message: 'Downgrade to which version?', options: [...] })
5. self-installer.installGlobal(pm, pkg, targetVersion)
```

**`upgrade`:**
- Same as `update` but query latest major instead of latest matching
- (Or alias to `update` — MVP simplification: skip, treat as synonym)

**`uninstall`:**
```
1. detect() → { pm: 'pnpm', version: '0.1.0' }
2. prompts.confirm(`Uninstall jss-devtools from pnpm?`)
3. self-installer.removeGlobal('pnpm', 'jss-devtools')
```

## PM Detection Strategy

**Approach: probe each PM's global list**

For each candidate PM (in priority order):
1. Run `<pm> ls -g jss-devtools --json` (or equivalent)
2. If exit 0 + output contains package → this is the owner
3. If exit non-zero or not found → try next PM

**Priority order:** pnpm → npm → yarn → bun
(pnpm most likely for this CLI's audience; bun newer)

**Implementation:**
```ts
// src/core/global-pm-detector/index.ts
import { execa } from 'execa';

const PROBES = [
  { pm: 'pnpm', args: ['list', '-g', '--depth=0', '--json'] },
  { pm: 'npm', args: ['ls', '-g', '--depth=0', '--json'] },
  { pm: 'yarn', args: ['global', 'list', '--json'] },
  { pm: 'bun', args: ['pm', 'ls', '-g'] },
];

export const detectGlobalPM = async (packageName: string): Promise<{ pm: string; version: string } | null> => {
  for (const probe of PROBES) {
    try {
      const { stdout } = await execa(probe.pm, probe.args, { reject: false });
      if (stdout.includes(`"${packageName}"`) || stdout.includes(packageName)) {
        // Parse version from output (PM-specific JSON shapes)
        const version = parseVersionFromOutput(probe.pm, stdout, packageName);
        return { pm: probe.pm, version };
      }
    } catch { /* try next */ }
  }
  return null; // CLI not globally installed via any PM
};
```

**Alternative: nypm-based detection**
- `nypm` already in deps; check if it has `detectGlobalPackageManager` API
- Fall back to manual probe if not

## Self-Install Commands per PM

```ts
// src/core/self-installer/commands.ts
export const INSTALL_COMMANDS = {
  npm:   { install: 'install', flag: '-g', pkg: '<pkg>@<version>', remove: 'uninstall' },
  pnpm:  { install: 'add',     flag: '-g', pkg: '<pkg>@<version>', remove: 'remove' },
  yarn:  { install: 'global',   flag: 'add', pkg: '<pkg>@<version>', remove: 'global remove' },
  bun:   { install: 'install',  flag: '-g', pkg: '<pkg>@<version>', remove: 'remove' },
} as const;

export const buildInstallCommand = (pm: string, pkg: string, version: string): string[] => {
  const config = INSTALL_COMMANDS[pm];
  if (!config) throw new Error(`Unknown PM: ${pm}`);
  return config.flag === 'global'
    ? ['global', 'add', `${pkg}@${version}`]
    : [config.install, config.flag, `${pkg}@${version}`];
};
```

**Note:** yarn classic only. Yarn Berry (PnP) doesn't have `global` command — out of scope.

## UX Flow (clack prompts)

### `jss-devtools update` (interactive)
```
┌─────────────────────────────────────────────────────┐
│  Update jss-devtools                                 │
│                                                     │
│  Current: 0.1.0                                      │
│  Latest:  0.5.2                                      │
│  Package manager: pnpm v9.1.0                        │
│                                                     │
│  Will run: pnpm add -g jss-devtools@0.5.2            │
│                                                     │
│  ? Continue? (Y/n)                                  │
└─────────────────────────────────────────────────────┘
```

### `jss-devtools downgrade` (interactive)
```
┌─────────────────────────────────────────────────────┐
│  Downgrade jss-devtools                              │
│                                                     │
│  Current: 0.5.2                                      │
│  Available versions:                                 │
│  ❯ 0.5.1                                            │
│    0.4.3                                            │
│    0.4.2                                            │
│    0.4.0                                            │
│                                                     │
│  Package manager: pnpm v9.1.0                        │
│  Will run: pnpm add -g jss-devtools@0.5.1            │
│                                                     │
│  ↑↓ navigate · ⏎ select                              │
└─────────────────────────────────────────────────────┘
```

### Non-TTY behavior (CI, scripts)
- Skip confirm prompt
- Use `--yes` flag explicitly OR fail with "TTY required"
- MVP: require `--yes` flag in non-TTY; document in --help

## Related Code Files

**Create:**
- `src/core/global-pm-detector/index.ts`
- `src/core/global-pm-detector/types.ts`
- `src/core/registry-client/index.ts`
- `src/core/registry-client/fetch-package.ts`
- `src/core/registry-client/types.ts`
- `src/core/self-installer/index.ts`
- `src/core/self-installer/commands.ts`
- `src/utils/prompts.ts` (shared confirm/select wrappers)
- `src/commands/self-update.ts`
- `src/commands/self-upgrade.ts`
- `src/commands/self-downgrade.ts`
- `src/commands/self-uninstall.ts`

**Modify:**
- `src/cli/router.ts` (add 4 subcommands, lazy import)
- `src/cli.ts` (intercept `--help`/`-v`/`--version` — unchanged)
- `tests/smoke.test.ts` (smoke tests for 4 commands, mocked PM exec)

## Implementation Steps

1. **PM detection module** — probe each PM's global list, return first match.
2. **Registry client** — npm registry fetch (latest + versions list) with timeout/retry.
3. **Self-installer module** — build per-PM command arrays, execute via execa with `stdio: inherit`.
4. **Prompts utility** — wrapper around @clack/prompts for confirm/select with TTY detection.
5. **`self-update` command** — detect + fetch latest + confirm + install.
6. **`self-upgrade` command** — alias to `self-update` (or implement separate major-bump logic).
7. **`self-downgrade` command** — detect + fetch versions + select + install.
8. **`self-uninstall` command** — detect + confirm + remove.
9. **Router update** — lazy-import 4 subcommands.
10. **Smoke tests** — mock execa calls, verify command builder logic.

## Success Criteria

- [ ] `jss-devtools update` installs latest version via detected PM
- [ ] `jss-devtools upgrade` behaves same as update (or implements major-bump if scope allows)
- [ ] `jss-devtools downgrade` shows previous version selector, installs chosen
- [ ] `jss-devtools uninstall` removes via detected PM
- [ ] PM detection works for npm/pnpm/yarn/bun
- [ ] `--yes` flag bypasses confirm prompts (CI/script use)
- [ ] `--json` flag outputs structured result (no prompts)
- [ ] TTY detection skips prompts in non-TTY (or requires `--yes`)
- [ ] Errors handled gracefully (PM not installed, CLI not globally installed, network failure)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| PM not installed | Detect failure → clear error: "Cannot detect package manager. Run via npm/pnpm/yarn/bun." |
| CLI not globally installed | Detect failure → clear error: "jss-devtools not found in global installs. Install with: <pm> add -g jss-devtools" |
| Network failure (registry) | Timeout 10s + 1 retry, then fail with clear message |
| User cancels confirm | Exit 0 with no changes |
| Wrong PM detected (rare) | Show detected PM in confirm prompt; user can abort |
| Yarn Berry user (no `global` command) | Detect yarn classic only; show clear error for Yarn Berry |
| Concurrent execution (race) | CLI is single-process, no risk |
| PM upgrades CLI while running | Out of scope; document "Restart shell after upgrade" |

## Out of Scope (Phase 5+)

- Self-update via curl/binary replace (no PM) — too complex, security concerns
- Version pinning (`.jssdevtoolsrc` to lock CLI version)
- Auto-update on startup (background check + notify)
- Plugin system that hooks into update notifications
- Multi-package self-management (manage multiple globally-installed CLIs)

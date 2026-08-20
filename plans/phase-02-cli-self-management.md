---
phase: 2
title: "CLI Self-Management"
status: completed
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: CLI Self-Management

## Overview

CLI quản lý chính nó qua 4 commands: `update`, `upgrade`, `downgrade`, `uninstall`. Mọi write operation delegate to package manager đã detect (npm/pnpm/yarn classic/bun). Không modify files trực tiếp.

## Requirements

### Functional — 4 commands với semantics chốt

#### `jss-devtools update`

**Restricted semantics (intentional):**
- **`jss-devtools update`** (no args) → alias của `jss-devtools upgrade` (auto-pick latest version)
- **`jss-devtools update check`** → read-only inspection:
  - Call `npm view <pkg>` (hoặc registry HTTP equivalent)
  - Show 5 latest versions grouped by major (e.g., `1.5.0, 1.4.0, 0.9.0, 0.5.0, 0.1.0`)
  - No install, no prompt, no side effects
- **`jss-devtools update <spec>`** → ERROR (use `upgrade <spec>` instead)

**Rationale:** giới hạn `update` để không overlap với `upgrade`. `update` = simple shortcut (latest). `upgrade` = powerful control (spec, validations).

#### `jss-devtools upgrade`

- **`jss-devtools upgrade`** (no args) → auto pick latest version, install via PM
- **`jss-devtools upgrade <spec>`** → validate spec, install matching version
  - Valid spec: `latest`, dist-tags (`next`, `beta`), semver (`^0.5`, `0.5.2`, `~1.0.0`)
  - Validation: resolve spec via registry, compare with current
    - target > current → upgrade (proceed)
    - target < current → warn "you're downgrading, use `downgrade` instead"
    - target === current → "already at this version, nothing to do"
    - invalid spec / not found → error

#### `jss-devtools downgrade`

Mirror của `upgrade` với inverse logic:
- **`jss-devtools downgrade`** (no args) → auto pick previous version (lowest stable OR version before current)
- **`jss-devtools downgrade <spec>`** → validate spec, install matching version
  - target < current → downgrade (proceed)
  - target > current → warn "you're upgrading, use `upgrade` instead"
  - target === current → noop
  - invalid spec / not found → error

#### `jss-devtools uninstall`

- Remove CLI from global install via detected PM
- Confirm before apply (TTY only)
- `--yes` skip confirm

### Common flags (all 4 commands)

- `--yes` — skip confirm prompt (still apply)
- `--dry-run` — print command that would run, exit 0, no execute (learning flag)
- `--json` — output structured JSON instead of formatted

### Non-functional

- Network calls có timeout + retry (npm registry query)
- Detect PM works across npm/pnpm/yarn classic/bun (Yarn Berry: show clear error)
- TTY detection: skip prompts in non-TTY unless `--yes` provided
- Smoke tests only (per `docs/code-standards.md`); unit tests added pre-release
- Restart shell hint after successful update/upgrade/downgrade (PATH cache may be stale)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ User: jss-devtools upgrade 0.5.2                     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ Detect installed PM (cached per process)              │
│ - probe pnpm → npm → yarn → bun (sequential)          │
│ - first PM whose `ls -g jss-devtools` returns match    │
│ - extract current version                            │
│ - if none → error + suggest install command          │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ Resolve target version                               │
│ - no args: fetch `dist-tags.latest` (or highest stable)│
│ - <spec>: fetch `dist-tags[spec]` or versions matching│
│ - compare target vs current → upgrade/downgrade/nowarn │
└──────────────────────�───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ Confirm via @clack/prompts (TTY only, unless --yes)  │
│ - show: current → target, PM, command preview         │
│ - if major bump: show warning banner                 │
│ - prompt: continue?                                  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ Execute (or dry-run)                                 │
│ - if --dry-run: print command + exit 0               │
│ - else: execa(pm, [...args], { stdio: 'inherit' })   │
│ - print result via consola                           │
│ - if PM operation succeeded: print restart shell hint │
└──────────────────────────────────────────────────────┘
```

### Module Layout

```
src/
├── core/
│   ├── global-pm-detector/        # detect which PM installed CLI globally
│   │   ├── index.ts
│   │   └── types.ts
│   ├── registry-client/            # npm registry HTTP queries
│   │   ├── index.ts
│   │   ├── fetch-package.ts        # GET /{pkg} → metadata + versions
│   │   ├── fetch-versions.ts       # GET /{pkg} → versions list only
│   │   └── types.ts
│   ├── version-resolver/           # semver comparison, spec validation
│   │   ├── index.ts
│   │   ├── resolve-target.ts       # given spec + current → target version
│   │   └── types.ts
│   └── self-installer/             # execute PM commands
│       └── index.ts
├── commands/
│   └── self/
│       ├── update.ts               # alias wrapper + check subcommand
│       ├── upgrade.ts              # upgrade no-args + upgrade <spec>
│       ├── downgrade.ts            # downgrade no-args + downgrade <spec>
│       ├── uninstall.ts
│       ├── update-check.ts
│       └── utils/
│           ├── update-shared.ts    # shared upgrade flow (used by update + upgrade)
│           └── pm-commands.ts      # INSTALL_COMMANDS map per PM (self-specific)
└── utils/
    └── prompts.ts                  # shared @clack/prompts wrappers (general, not self-specific)
```

## PM Detection Strategy

**Approach:** probe each PM's global list sequentially.

For each candidate (priority: pnpm > npm > yarn classic > bun):
1. Run `<pm> <list-command> jss-devtools --json` (or similar)
2. If exit 0 + output mentions package → this PM owns the CLI
3. Parse version from JSON output (PM-specific shape)

**Probe table:**

| PM | Command | JSON output shape |
|---|---|---|
| pnpm | `pnpm list -g --depth=0 --json` | `{ dependencies: { "jss-devtools": { "version": "0.1.0" } } }` |
| npm | `npm ls -g --depth=0 --json` | `{ dependencies: { "jss-devtools@0.1.0": { ... } } }` |
| yarn classic | `yarn global list --json` | `{ data: [["jss-devtools@0.1.0", "info"]] }` |
| bun | `bun pm ls -g --json` | varies; fallback parse name@version string |

**Cache:** store detected PM in module-level variable after first successful detection (avoid 4 subprocess calls per command).

## Spec Resolution

Given `<spec>` argument + current version:

1. Query registry for `<pkg>` metadata:
   - `dist-tags` (latest, next, beta, etc.)
   - `versions` array
2. Resolve spec:
   - If `spec` is a dist-tag → use that version
   - If `spec` is semver range → find max version satisfying range (stable, non-prerelease)
   - If `spec` is exact version → use it
3. Validate target exists in versions list
4. Compare with current:
   - target > current → proceed (upgrade)
   - target < current → warn + suggest inverse command
   - target === current → "already at this version"
   - target invalid → error

**Implementation hint:**
```ts
import semver from 'semver'

export const resolveTarget = (
  spec: string | undefined,
  current: string,
  metadata: RegistryMetadata
): { target: string; action: 'upgrade' | 'downgrade' | 'noop' | 'warn-inverse' } => {
  if (!spec) {
    return { target: metadata['dist-tags'].latest, action: 'upgrade' }
  }
  // dist-tag
  if (metadata['dist-tags'][spec]) {
    const target = metadata['dist-tags'][spec]
    return compareVersions(target, current, spec)
  }
  // semver range
  if (semver.validRange(spec)) {
    const target = metadata.versions
      .filter(v => semver.valid(v) && !semver.prerelease(v))
      .filter(v => semver.satisfies(v, spec))
      .sort(semver.rcompare)[0]
    if (!target) throw new Error(`No version satisfies ${spec}`)
    return compareVersions(target, current, spec)
  }
  // exact
  if (semver.valid(spec)) {
    return compareVersions(spec, current, spec)
  }
  throw new Error(`Invalid spec: ${spec}`)
}
```

## Self-Install Command Builder

```ts
// src/core/self-installer/commands.ts
export const INSTALL_COMMANDS = {
  npm:  { install: 'install', flag: '-g',         remove: 'uninstall' },
  pnpm: { install: 'add',    flag: '-g',          remove: 'remove'    },
  yarn: { install: 'global', flag: 'add',         remove: 'global', suffix: 'remove' },
  bun:  { install: 'install', flag: '-g',         remove: 'remove'    },
} as const

export const buildUpgradeCommand = (pm: string, pkg: string, version: string): string[] => {
  const cfg = INSTALL_COMMANDS[pm]
  if (!cfg) throw new Error(`Unknown PM: ${pm}`)
  if (pm === 'yarn') return ['global', 'add', `${pkg}@${version}`]
  return [cfg.install, cfg.flag, `${pkg}@${version}`]
}

export const buildRemoveCommand = (pm: string, pkg: string): string[] => {
  const cfg = INSTALL_COMMANDS[pm]
  if (!cfg) throw new Error(`Unknown PM: ${pm}`)
  if (pm === 'yarn') return ['global', 'remove', pkg]
  return [cfg.remove, cfg.flag, pkg]
}
```

**Yarn Berry:** no `global` command → detection should detect yarn classic only. If user has yarn berry, show: "Yarn Berry has no global package support. Use npm/pnpm/bun instead."

## Dry-run Implementation

Shared helper for all 4 commands:

```ts
// src/core/self-installer/index.ts
export const executeOrDryRun = async (
  pm: string,
  args: string[],
  dryRun: boolean
): Promise<{ ok: boolean; dryRun: boolean; cmdStr: string }> => {
  const cmdStr = `${pm} ${args.join(' ')}`
  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${cmdStr}`)
    return { ok: true, dryRun: true, cmdStr }
  }
  logger.info(`Executing: ${cmdStr}`)
  await execa(pm, args, { stdio: 'inherit' })
  return { ok: true, dryRun: false, cmdStr }
}
```

Behavior:
- `--dry-run` → print `[dry-run]` prefix, exit 0, no exec
- without `--dry-run` → exec via execa (real)

## UX Flows (clack prompts)

### `jss-devtools upgrade 0.5.2` (interactive)
```
┌─────────────────────────────────────────────┐
│  Upgrade jss-devtools                        │
│                                             │
│  Current: 0.1.0                              │
│  Target:  0.5.2                              │
│  Package manager: pnpm v9.1.0                │
│                                             │
│  Will run: pnpm add -g jss-devtools@0.5.2    │
│                                             │
│  ? Continue? (Y/n)                          │
└─────────────────────────────────────────────┘
```

### `jss-devtools upgrade` (no args)
- Same as above, but target is auto-detected from `dist-tags.latest`

### `jss-devtools upgrade 2.0.0` (major bump)
```
┌─────────────────────────────────────────────┐
│  Upgrade jss-devtools                        │
│                                             │
│  ⚠️  Major version bump: 0.1.0 → 2.0.0      │
│     Breaking changes likely.                 │
│     Check CHANGELOG before proceeding.       │
│                                             │
│  Current: 0.1.0                              │
│  Target:  2.0.0                              │
│  Package manager: pnpm v9.1.0                │
│  Will run: pnpm add -g jss-devtools@2.0.0    │
│                                             │
│  ? Continue? (Y/n)                          │
└─────────────────────────────────────────────┘
```

### `jss-devtools update check`
```
┌─────────────────────────────────────────────┐
│  Available versions of jss-devtools         │
│                                             │
│  1.5.2   2026-08-15                         │
│  1.4.0   2026-07-20                         │
│  0.9.0   2026-06-10                         │
│  0.5.0   2026-05-01                         │
│  0.1.0   2026-04-15  (current)              │
│                                             │
└─────────────────────────────────────────────┘
```

### `jss-devtools downgrade`
- Show select prompt with previous versions
- Then confirm + exec

### `jss-devtools uninstall`
```
┌─────────────────────────────────────────────┐
│  Uninstall jss-devtools                      │
│                                             │
│  Current: 0.1.0                              │
│  Package manager: pnpm v9.1.0                │
│  Will run: pnpm remove -g jss-devtools       │
│                                             │
│  ? Continue? (Y/n)                          │
└─────────────────────────────────────────────┘
```

### After successful update/upgrade/downgrade

Print hint:
```
✅ jss-devtools updated to 0.5.2
💡 Restart your shell to refresh PATH cache.
```

## Related Code Files

**Create:**
- `src/core/global-pm-detector/index.ts`
- `src/core/global-pm-detector/types.ts`
- `src/core/registry-client/index.ts`
- `src/core/registry-client/fetch-package.ts`
- `src/core/registry-client/fetch-versions.ts`
- `src/core/registry-client/types.ts`
- `src/core/version-resolver/index.ts`
- `src/core/version-resolver/resolve-target.ts`
- `src/core/version-resolver/types.ts`
- `src/core/self-installer/index.ts`
- `src/commands/self/update.ts`
- `src/commands/self/upgrade.ts`
- `src/commands/self/downgrade.ts`
- `src/commands/self/uninstall.ts`
- `src/commands/self/update-check.ts`
- `src/commands/self/utils/update-shared.ts`
- `src/commands/self/utils/pm-commands.ts`
- `src/utils/prompts.ts` (general, not self-specific)

**Modify:**
- `src/cli/router.ts` (add 4 subcommands, lazy import)
- `package.json` (add `semver` runtime dep + `execa` already there)

## Implementation Steps

1. **PM detection module** (`src/core/global-pm-detector/`) — probe pnpm/npm/yarn/bun, return first match.
2. **Registry client** (`src/core/registry-client/`) — npm registry fetch với Node `fetch` (built-in) + timeout 10s + 1 retry.
3. **Version resolver** (`src/core/version-resolver/`) — semver spec resolution, target vs current comparison.
4. **PM commands map** (`src/utils/pm-commands.ts`) — INSTALL_COMMANDS per PM.
5. **Self-installer module** (`src/core/self-installer/`) — execute via execa with `stdio: inherit`.
6. **Prompts utility** (`src/utils/prompts.ts`) — TTY-aware wrappers.
7. **`self-update` command** — alias for upgrade + `check` subcommand.
8. **`self-upgrade` command** — auto-pick latest OR upgrade `<spec>`.
9. **`self-downgrade` command** — mirror upgrade logic.
10. **`self-uninstall` command** — detect + confirm + remove.
11. **Router update** — lazy-import 4 subcommands.
12. **Smoke tests** — mock execa calls in `tests/smoke.test.ts`, verify command builders + spec resolution.

## Success Criteria

- [ ] `jss-devtools update` behaves same as `jss-devtools upgrade`
- [ ] `jss-devtools update check` shows 5 latest versions grouped by major (no install, no prompt)
- [ ] `jss-devtools upgrade` installs latest via detected PM
- [ ] `jss-devtools upgrade <spec>` validates spec, upgrades to matching version
- [ ] `jss-devtools upgrade` to lower version → warns + suggests `downgrade`
- [ ] `jss-devtools downgrade` mirrors upgrade logic (inverse)
- [ ] `jss-devtools uninstall` removes via detected PM
- [ ] PM detection works for npm/pnpm/yarn classic/bun (probe sequential)
- [ ] `--yes` skips confirm prompt, still applies
- [ ] `--dry-run` prints command, doesn't execute, exit 0
- [ ] `--json` outputs structured result
- [ ] Restart shell hint after successful update/upgrade/downgrade
- [ ] Major bump warning shown in confirm prompt

## Risk Assessment

| Risk | Mitigation |
|---|---|
| PM not installed | Show: "Cannot detect package manager. Install via npm/pnpm/yarn/bun." |
| CLI not globally installed | Show: "jss-devtools not found in global installs. Install with: <pm> add -g jss-devtools" |
| Network failure (registry) | Timeout 10s + 1 retry, fail with clear message |
| Spec not found in registry | Error: `No version satisfies '<spec>'` |
| User cancels confirm | Exit 0 with no changes |
| Major bump accidental | Warning banner in confirm prompt; user must explicitly confirm |
| Wrong PM detected | Show detected PM in confirm prompt; user can abort |
| Yarn Berry user (no `global` command) | Detect yarn classic only; show: "Yarn Berry has no global support" |
| Restart shell forgotten | Hint after successful update |

## Out of Scope (Phase 5+)

- Self-update via curl/binary replace (no PM) — too complex, security concerns
- Version pinning (`.jssdevtoolsrc` to lock CLI version)
- Auto-update on startup (background check + notify)
- Plugin system that hooks into update notifications
- Multi-package self-management (manage multiple globally-installed CLIs)
- Custom registry support (private npm registry)

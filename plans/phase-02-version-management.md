---
phase: 2
title: "Version Management Commands"
status: pending
priority: P2
effort: "5h"
dependencies: [1]
---

# Phase 2: Version Management Commands

## Overview

MVP commands `ls`, `update`, `upgrade`, `downgrade` hoạt động end-to-end với npm registry integration.

## Requirements

- **Functional:**
  - `jss-devtools ls [pkg]` — list installed (từ `package.json` + lockfile) + available (từ registry).
  - `jss-devtools update [pkg...]` — update packages theo semver range.
  - `jss-devtools upgrade [pkg...]` — upgrade có `--major` / `--minor` / `--patch` flags.
  - `jss-devtools downgrade [pkg...]` — downgrade tới version trước.
  - `--json` output cho mọi command.
- **Non-functional:**
  - Network calls có timeout + retry.
  - Test coverage ≥ 80% trên `core/`.

## Architecture

```
src/
├── core/
│   ├── registry-client/        # npm registry HTTP client
│   │   ├── index.ts
│   │   ├── fetch-package.ts
│   │   └── types.ts
│   └── version-resolver/       # semver logic
│       ├── index.ts
│       ├── resolve-range.ts
│       └── types.ts
└── commands/
    ├── ls.ts
    ├── update.ts
    ├── upgrade.ts
    └── downgrade.ts

tests/
├── unit/
│   ├── registry-client.test.ts
│   └── version-resolver.test.ts
└── integration/
    ├── ls.test.ts
    ├── update.test.ts
    └── ...
```

## Related Code Files

**Create:**
- `src/core/registry-client/index.ts`
- `src/core/registry-client/fetch-package.ts`
- `src/core/registry-client/types.ts`
- `src/core/version-resolver/index.ts`
- `src/core/version-resolver/resolve-range.ts`
- `src/core/version-resolver/types.ts`
- `src/commands/ls.ts`
- `src/commands/update.ts`
- `src/commands/upgrade.ts`
- `src/commands/downgrade.ts`
- Tests for each

**Modify:**
- `src/cli/router.ts` (add 4 new subcommands)

## Implementation Steps

1. **Registry client** — fetch từ `https://registry.npmjs.org/{pkg}` với AbortController timeout (10s), retry 1 lần.
2. **Version resolver** — semver logic dùng `semver` package (resolve, satisfies, diff).
3. **PM detector** — detect npm/pnpm/yarn/bun từ lockfile (dùng `nypm`).
4. **`ls` command** — read `package.json` + lockfile → installed list; fetch registry → available list.
5. **`update` command** — resolve latest trong range hiện tại, propose, apply.
6. **`upgrade` command** — `--major` / `--minor` / `--patch` flags → bump tương ứng.
7. **`downgrade` command** — resolve previous version (trong range constraint), apply.
8. **Integration tests** với mocked registry responses (nock hoặc manual fetch mock).

## Success Criteria

- [ ] Mỗi command chạy được với `jss-devtools <cmd> [pkg]` trên fixture project.
- [ ] `--json` output đúng schema.
- [ ] Test coverage ≥ 80% trên `core/`.
- [ ] Network failures handle gracefully (timeout, retry, clear errors).

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Registry rate limiting | Respect ETag + cache responses |
| Lockfile format changes giữa PM versions | Pin PM versions in fixtures |
| Semver edge cases | Comprehensive semver tests; reuse battle-tested `semver` package |
| User's actual project modification | Use PM's own commands (npm/pnpm/yarn/bun) thay vì manual file edit |

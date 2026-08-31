# Scout Report — `jss-devtools init` design

Date: 2026-08-30 | Scope: jss-devtools (this repo) + jss-cli (reference: `/Users/tandm/Documents/jjuidev/npm/jss-cli`)

## A. jss-devtools — existing patterns (must conform)

### CLI framework
- citty v0.2.2. Router: `src/cli/router.ts` — `subCommands` map, lazy `import().then(m => m.default)`.
- Leaf command pattern (`src/commands/self/upgrade.ts`): `defineCommand({ meta, args, run })`, `run` delegates to flow fn with extracted args.

### Args/flags conventions
- `type: 'positional' | 'boolean'`; kebab-case flags; `-y` alias for `--yes`.
- Universal flags on mutating commands: `--yes` (skip prompts), `--dry-run` (print, no exec), `--json` (structured stdout).
- Validation in runtime logic (parse/resolve fns), not schema validators.

### Core modules reusable for init
- `src/core/detector/global-pm.ts` — `detectGlobalPM(pkg) → DetectedPM | null`; `AgentName` (npm/pnpm/yarn/bun/deno/nub/aube) from `package-manager-detector`; probe order pnpm→npm→yarn→bun; 10s timeout; in-proc cache. **Global PM only — no project-lockfile detection yet.**
- `src/core/store/store.ts` — conf v15; `pmLedger { pmsSeen, lastPm, lastSeenAt }`; `JSS_DEVTOOLS_STORE_DIR` env for tests; graceful degradation.
- `src/core/self-installer/exec.ts` — `execOrDryRunInstall/Remove(pm, pkg, version, dryRun, { capture })` → `ExecResult { ok, dryRun, cmdStr, pm }`; stdio inherit (human) / pipe (json). Never throws at leaf.
- `src/core/registry-client/fetch-package.ts` — npm registry fetch (versions/metadata).
- `src/core/version-resolver/resolve-target.ts` — semver spec resolution.

### UX conventions
- Logger: consola → **stderr** (stdout reserved for JSON). Colors: primary/cyan, secondary/magenta, muted/gray.
- Prompts: `@clack/prompts` via `confirmOrCancel`; non-TTY: reversible → auto-proceed, destructive → error exit 1 (`REQUIRES_CONFIRMATION`).
- Result: `CommandResultStatus = 'success' | 'dry-run' | 'noop' | 'cancelled' | 'error'`; exit codes 0/1/2.

### Architecture constraints (docs/system-architecture.md, code-standards.md)
- Help at every node; JSON output every command; dry-run for mutating ops; CI-friendly (minimal prompts).
- Module boundary: CLI → commands → core; **no CLI deps in core**.
- Files: kebab-case, one responsibility, **no index.ts barrels**, `@/` alias, `.js` ext in imports, why-comments only, strict TS no `any`.

### Runtime deps
@clack/prompts ^1.7.0, citty ^0.2.2, conf ^15.1.0, consola ^3.4.2, execa ^10.0.1, figlet, nypm ^0.6.9, package-manager-detector ^1.8.0, pathe ^2.0.3, semver ^7.8.5.

### Repo's own toolchain (reference target-state for init output)
eslint ^10.9.1 + @eslint/js + @typescript-eslint ^8.68 + eslint-plugin-* ^10.9.1 + globals; prettier ^3.9.6; prettier-package-json ^2.8.0; husky ^9.1.7; lint-staged ^17.4.1; tsc-alias ^1.9.2; typescript ^5.9.3; tsup; vitest; changesets.

### Existing scaffold logic: NONE. Init will be the first generator; no preset/template engine exists.

## B. jss-cli — init reference (learn + gap-fill)

### Flow: detect → resolve → install → formatter → husky
- `src/commands/init/index.ts` (225 LOC) orchestrates; utils: `setup-pkgs.ts` (pkg defs + getIntendedRanges + buildInstallPlan + executeInstall), `setup-formatter.ts` (prettier + eslint config gen + pkg.json scripts), `setup-husky.ts` (git init `-b main`, husky init, pre-commit merge preserving user lines, one lint-staged line).
- `repo-detector.ts`: framework via deps; foreign-linter guard (Biome/Oxlint → abort).
- `config-detector.ts`: existing eslint/prettier config files (incl. pkg.json fields) → conflict prompt Replace/Keep/Cancel (default Replace; `-y` auto-replace; fast-path if already target format).
- `eslint-config-generator.ts`: flat config `eslint.config.mjs`, framework plugin blocks.
- `install-confirm.ts`: 3-mode install flow.
- Version strategy: peerDependencies ranges (`^6 || ^7 || ^8`), resolve latest in major on install (buildPkgSpec), cached.
- Idempotent writes: compare content before write, silent if unchanged.
- Install: sequential prod→dev via execa, stdio inherit, **no workspace support**.

### jss-cli gaps → jss-devtools init must add
1. commitlint: `@commitlint/cli` + `@commitlint/config-conventional` (default rules) + commit-msg hook. (jss-cli: absent)
2. `prettier-package-json`: run via PM runner (`npx`/`pnpm dlx`/`yarn dlx`/`bunx` per detected PM). (jss-cli: absent)
3. Typescript scaffold: tsconfig gen + path alias (`tsc-alias`?) + `@types/*`. (jss-cli: absent)
4. Framework presets node/react/react-native/next as explicit scaffold modes (jss-cli: deps-guess only, no RN/next distinction).
5. lint-staged config gen (jss-cli has: eslint fix + prettier write — keep).
6. scripts gen: lint/format/prepare/commitlint hooks (jss-cli: partial).
7. ESLint strategy: jss-cli pinned ESLint 8; jss-devtools should target ESLint 9/10 flat config (repo itself on ^10.9.1).
8. peerDependencies/peerDependenciesMeta add support (user requirement).

## C. Unresolved questions (→ feed brainstorm)
1. Framework selection UX: flag (`--framework react`), interactive prompt, or auto-detect from deps with confirm?
2. Project PM detection: lockfile-based (npm/yarn/pnpm/bun lock + `packageManager` field) vs global PM detector? (jss-devtools only has global today)
3. ESLint major target: 9 vs 10? Repo itself runs ^10.9.1 — align?
4. TypeScript scaffold on JS projects: optional add-on flag vs framework default?
5. Alias gen scope: tsconfig paths only, or bundler alias too (tsup/vite/metro)?
6. Monorepo/workspace: in-scope or explicitly out (v1)?
7. Idempotency model: adopt jss-cli's content-compare silent-skip?
8. Version pinning: peerDependencies-ranges strategy (jss-cli) vs fixed known-good versions?

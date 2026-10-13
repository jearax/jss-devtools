# System Architecture — `jss-devtools`

## Command Surface

```
jss-devtools
├── -h, --help            figlet banner + usage
├── -v, --version         banner + tagline + version
└── init                  overlay the toolchain on the project in cwd
    ├── --framework node  default; react | next | nest | rn are reserved (FRAMEWORK_NOT_SUPPORTED)
    ├── -y, --yes         accept defaults, replace conflicting configs
    ├── --dry-run         print the plan, write nothing
    ├── --json            single JSON result on stdout
    └── --no-linter | --no-commitlint | --no-install   (hidden; scanned from argv)
```

## `init` Pipeline

```
args ──▶ preflight ──▶ resolve specs ──▶ compute plan ──▶ confirm ──▶ apply
         (cwd checks)   (npm registry)    (pure)          (conflicts)  (fs + PM)
```

| Stage | Module | Responsibility |
|---|---|---|
| Args | `src/commands/init/utils/args.ts` | Validate `--framework`, scan hidden `--no-*` flags |
| Preflight | `src/commands/init/utils/preflight.ts` | Require a valid `package.json`; abort on monorepos and foreign linters; detect the PM (npm when no signal) and git |
| Resolve specs | `src/commands/init/install/resolve-specs.ts` | Pick peer-compatible versions; cap `typescript` at 5 and `eslint` at 10; keep `@eslint/js` on the `eslint` major |
| Compute plan | `src/commands/init/plan/compute-plan.ts` | Pure: turn args + file reads into write/remove/manifest/install/hook actions; drop content-equal writes so re-runs are no-ops |
| Confirm | `src/commands/init/utils/confirm-plan.ts` | One prompt for conflicting legacy configs: Replace / Keep / Cancel; non-TTY needs `--yes` |
| Apply | `src/commands/init/utils/apply-plan.ts` | Write files, edit `package.json`, run the PM `add -D`, activate husky |

Generated file content lives in `src/commands/init/generators/`, one module per file type.

## Shared Modules

| Module | Responsibility |
|---|---|
| `src/cli.ts`, `src/cli/router.ts` | Bin entry and citty router; banner on `--help` / `--version` |
| `src/core/detector/` | Package-manager detection and monorepo signals |
| `src/core/registry-client/` | npm registry metadata fetch |
| `src/core/runner/pm-commands.ts` | PM command mapping via `package-manager-detector` |
| `src/utils/` | Logger (stderr; stdout reserved for data), spinner, prompts, banner, package info |

## Output Contract

- Exit codes: `0` success, dry-run or noop; `1` user error, abort or cancel.
- `--json` prints exactly one document on stdout; logs go to stderr.
- Existing `.editorconfig` and `.vscode/*` are never rewritten. An existing `.gitignore` is only appended to, with `node_modules/` when no entry covers it; the file is reported under `modified`. Other differing configs need confirmation.

## Tech Stack

TypeScript (strict, ESM), citty, @clack/prompts, execa, figlet, package-manager-detector, semver; tsup build; Vitest; Node >= 24.

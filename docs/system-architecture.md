# System Architecture — `jss-devtools`

## High-Level

```
┌──────────────────────────────────────────────────────┐
│                     User Terminal                    │
└──────────────────────┬───────────────────────────────┘
                       │  $ jss-devtools <cmd> [args]
                       ▼
┌──────────────────────────────────────────────────────┐
│              Bin Entrypoint (bin/jss-devtools)       │
│              Resolves to compiled CLI                │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              Command Router / Parser                 │
│   - arg parser (commander / yargs / citty / native)   │
│   - dispatches to subcommand handler                 │
│   - emits --help at every node                       │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              Subcommand Handlers                     │
│   ┌─────────┬──────────┬────────────┬─────────────┐   │
│   │ version │ update   │ upgrade    │ downgrade   │   │
│   ├─────────┼──────────┼────────────┼─────────────┤   │
│   │ ls      │ scaffold │ help       │ (future)    │   │
│   └─────────┴──────────┴────────────┴─────────────┘   │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              Core Domain Modules                     │
│   - version-resolver  (semver / registry fetch)       │
│   - registry-client   (npm registry API)             │
│   - scaffold-engine   (template render + write)      │
│   - config-loader     (.jssrc / env)                 │
└──────────────────────────────────────────────────────┘
```

## Command Tree (MVP)

```
jss-devtools
├── --help
├── --version
├── help [command]
├── version
├── ls
│   ├── --installed
│   ├── --available
│   └── [package]
├── update [package...]
├── downgrade [package...]
├── upgrade [package...]
│   ├── --major
│   ├── --minor
│   └── --patch
└── scaffold
    └── init [preset]
        ├── --name <name>
        └── --cwd <path>
```

## Module Boundaries (planned)

| Module | Responsibility |
|---|---|
| `bin/` | Compiled entry script, sets up env, invokes CLI |
| `src/cli/` | Command router, arg parsing, help rendering |
| `src/commands/` | One file per subcommand (version, ls, update, etc.) |
| `src/core/version-resolver/` | Semver logic, range resolution |
| `src/core/registry-client/` | npm registry HTTP client |
| `src/core/scaffold-engine/` | Template + writer |
| `src/core/config-loader/` | Read `.jssrc`, env, defaults |
| `src/types/` | Shared TS types |
| `tests/` | Vitest unit + integration tests |

## UX Principles

- **Help everywhere** — every node in the tree accepts `--help` / `-h`
- **Predictable exit codes** — `0` success, `1` user error, `2` runtime error
- **JSON output** — every command supports `--json` for scripting
- **Dry-run by default for mutating ops** — explicit `--apply` to commit (TBD)
- **No interactive prompts unless explicit** — flags for CI-friendliness

## Tech Stack Anchors

- TypeScript (strict mode)
- pnpm workspaces (optional, for future plugin layout)
- Vitest
- Node 24 LTS baseline
- Build tool: TBD (see [code-standards.md](./code-standards.md))
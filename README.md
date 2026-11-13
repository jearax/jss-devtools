# jss-devtools

A rewrite of `@jjuidev/jss-devtools`: a command-line tool for JavaScript-stack repositories.

The CLI exists and is tested; `jss-devtools doctor` is its first command and `jss-devtools init`
its second, shipping the `node` and `nest` presets. See
[docs/project-roadmap.md](.harness/docs/project-roadmap.md) for what comes next and
[docs/system-architecture.md](.harness/docs/system-architecture.md) for how the current code is put together.

## Requirements

Node >=24.11.0 (`engines.node`) both to develop this repo and to run the CLI, plus pnpm 11.24.0 to
develop. It is the first release of the Node 24 LTS line, and every pinned package accepts it, so
pnpm refuses an older Node at install (`engineStrict`). CI runs exactly this version and no other
([decision 0026](.harness/decisions/0026-node-floor-24.md)).

pnpm is pinned through `packageManager`, so `corepack` selects the right version. There is no
`.npmrc` and no `.nvmrc`: pnpm reads its settings from `pnpm-workspace.yaml`, and the development
runtime is declared once in `package.json`.

Windows is not supported natively; use WSL (Windows Subsystem for Linux). The reasons are in
[docs/decisions/0030-init-node-preset.md](.harness/decisions/0030-init-node-preset.md).

## What the CLI does today

```bash
node dist/cli.mjs --help      # usage
node dist/cli.mjs -v          # the version from package.json (also --version)
node dist/cli.mjs doctor      # check the machine, exit 1 with a fix hint when a check fails
node dist/cli.mjs init my-app # create a TypeScript node project
node dist/cli.mjs init my-api --framework nest # create it as a Nest 12 app instead
node dist/cli.mjs init my-app --monorepo # create it as a Turborepo, the app under apps/node
node dist/cli.mjs init        # set up the current project
node dist/cli.mjs nope        # error plus help, exit code 1
```

The built CLI is a single self-contained file: it bundles its runtime dependencies and runs with no
`node_modules` beside it.

## Install

```bash
curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh
```

The installer needs Node >=24.11.0 and `curl` or `wget`. It writes the CLI to
`~/.jss-devtools/<version>/cli.mjs` and the `jss-devtools` command to `~/.local/bin/jss-devtools`,
and prints a `PATH` hint when that directory is not on your `PATH`. `JSS_DEVTOOLS_BASE_URL`,
`JSS_DEVTOOLS_HOME` and `JSS_DEVTOOLS_BIN_DIR` move those locations.

The site's home page is `https://jss-devtools.jjuidev.com/`. How it is deployed, and how to roll it
back, is in [docs/deployment-guide.md](.harness/docs/deployment-guide.md).

After the install, `jss-devtools doctor` checks the machine: the Node version against the floor,
whether git is installed, and the package managers init supports (bun, pnpm, yarn 1 and npm). Each
check that fails carries the fix, the command exits 1, and a manager that is only missing is shown,
not failed.

`jss-devtools init my-app` creates a folder holding a TypeScript node project that installs, lints,
typechecks, builds and runs (`node dist/main.js`), with git hooks active. `jss-devtools init` in an
existing TypeScript repository adds the same toolchain, merging what the user owns and stopping with
exit 1 and the list when a config init owns is already there (`--force` replaces them). Every check
runs before the first write; after it, `git init`, the install, the `package.json` sort and the
format of the written files can each still exit 1, and nothing is rolled back.
[decision 0030](.harness/decisions/0030-init-node-preset.md) records the flow; the full discussion
history is the [decision log](.harness/plans/261022-0141-init-flow-discussion/decision-log.md).
`init` formats every file it writes with the project's own Prettier, so the first format or commit
changes nothing ([decision 0046](.harness/decisions/0046-init-formats-the-files-it-writes.md)).

`jss-devtools init my-api --framework nest` creates a Nest 12 ESM app instead of the node project:
`src/main.ts`, an `app/` module with a `@nestjs/terminus` health route, `core/` modules for config, logging, i18n,
a database placeholder and helpers, and an example `learning/course` domain answering `/api/v1/courses`
through URI versioning, with zod validating the environment and request bodies. Every
JSON response is `{ status, message, data }`, its message translated per request (`?lang`, then
`x-lang`, then `Accept-Language`; `vi` and `en`) — a 404 inside or outside the prefix included
([decision 0049](.harness/decisions/0049-nest-response-envelope.md)). The toolchain around it is
the same, `dev` runs `nest start --watch`, and the preset only creates a project: an existing
folder set up with `init` refuses it ([decision 0047](.harness/decisions/0047-init-nest-preset.md)).
`--no-sample` skips the example domain (an empty `src/domains/.gitkeep` instead); it needs
`--framework nest` ([decision 0051](.harness/decisions/0051-nest-api-prefix-and-no-sample.md)).

`jss-devtools init my-app --monorepo` creates a Turborepo instead: the toolchain and the harness
once at the root, the app under `apps/node` (or `apps/nest` with `--framework nest`), and an empty
`packages/`, for bun, pnpm, yarn 1 and npm.
It works in create mode only
([decision 0045](.harness/decisions/0045-init-monorepo-creates-a-turborepo.md)).

## Development

```bash
pnpm install
pnpm build        # bundle src/cli.ts into dist/cli.mjs
pnpm lint         # ESLint, including formatting
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest (builds the bundle first, then runs every check)
pnpm format       # eslint --fix, then prettier --write
pnpm format:check # prettier --check, reporting only
pnpm stage:release # stage dist/cli.mjs into release/ for the site image
```

Run the four checks in that order before claiming a change is done. `pnpm test` builds the CLI
itself, so a green test run also proves the build works. `pnpm lint` runs Prettier as an ESLint rule,
so a green lint already means the formatting is right.

`pnpm stage:release` writes `release/cli.mjs` and `release/checksums.txt`, the two files the site
image carries. The directory is git-ignored and exists only between staging and the image build.

Editor settings for VS Code live in `.vscode/`. Every formatting fact Prettier and the editor share
(charset, line endings, indentation, width, final newline, trailing whitespace) is declared once, in
`.editorconfig`; install the recommended EditorConfig extension so VS Code applies it while you
type. `.prettierrc.json` holds only the settings Prettier alone decides.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) and are checked
by a git hook. The repository history is a single line on `main`; push with
`git push -u origin main`. A green push to `main` deploys the site, so read
[docs/deployment-guide.md](.harness/docs/deployment-guide.md) before you push.

## License

MIT. See [LICENSE](./LICENSE).

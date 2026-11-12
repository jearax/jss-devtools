# Brainstorm: `init --monorepo` with Turborepo

Status: contract accepted by the user on 2026-11-12, ready for planning. Nothing is implemented.

## Conflict with a decision in force

[Decision 0030](../../decisions/0030-init-node-preset.md) says "Monorepos are not supported" and
lists monorepos as a non-goal. `src/commands/init/services/preflight.service.ts:220` enforces it in
existing mode. This work needs a new decision (next free number, 0045) that supersedes that part
of 0030 and quotes the user's answers below. 0030 itself is not edited.

## Outcome

`jss-devtools init my-app --monorepo` creates a Turborepo monorepo modelled on
`dokploy/design-system` (decision 0014):

```text
my-app/
├─ turbo.json              see "Root files follow the Turborepo docs" below
├─ package.json            private; scripts call turbo run …; toolchain devDependencies + turbo
├─ pnpm-workspace.yaml     pnpm only: packages apps/*, packages/*, plus allowBuilds, strict flags
│                          npm / yarn 1: a workspaces field in package.json instead
├─ eslint.config.mjs, .prettierrc.json, .prettierignore, .editorconfig, commitlint.config.mjs
├─ .gitignore              also ignores .turbo
├─ .husky/, .vscode/, .harness/, CLAUDE.md, .claude/   once, at the root
├─ apps/
│  └─ node/                named after --framework, so react, nest … join beside it later
│     ├─ package.json      name @my-app/node; dev, build, typecheck, lint scripts; own dependencies
│     ├─ tsconfig.json     same module setup as the single-package preset (@/ alias, tsc-alias)
│     └─ src/main.ts
└─ packages/.gitkeep
```

`--monorepo` defaults to off; without it `init` behaves exactly as today.

## User answers (2026-11-12)

> Layout: "Root + 1 app starter" — "root dùng convention như trong repo này là my-app nha, dùng
> tên apps/<framework_mode> nha, để sau này scale theo react|nest|..."

> Mode: "Chỉ create mode"

> Package managers: "pnpm, npm, yarn 1"

> Toolchain: "Một bản ở root"

## Constraints

- Create mode only. `init --monorepo` without `<dir>` exits 1 before any write and names
  `jss-devtools init <project-name> --monorepo` as the next step. Existing mode, including its
  monorepo rejection, is unchanged.
- Same flow as today: preflight, plan, `--dry-run`, one confirmation, writes, one install at the
  root, sort, optional AgentKit. Every check runs before the first write.
- `--pm` keeps its meaning: pnpm, npm, yarn 1 and bun (yarn 2+ still exits 1). Bun was added
  while planning, when `--pm` turned out to accept it: "Hỗ trợ bun" (user, 2026-11-12).
- The existing flags (`--framework`, `--no-vscode`, `--no-harness`, `--agent-kit`, `-f`, `-y`,
  `--dry-run`) combine with `--monorepo`. `--framework` still only accepts a built preset (`node`),
  and its value names the app folder.
- `turbo` is pinned through `scripts/pin-node-preset.mjs`, never by hand, and must be older than
  pnpm's `minimumReleaseAge`.
- The harness is installed once, at the root.
- Repo rules: role suffixes and folders from decision 0024, the `@/` alias, files under 200 lines,
  architecture tests stay green.

## Non-goals

- `--monorepo` in existing mode, or converting a single package into a monorepo.
- Shared config packages (`packages/eslint-config`, `packages/tsconfig`).
- A shared library under `packages/`, or a command that adds apps or packages later.
- Frameworks other than `node`, remote caching, Nx or other monorepo tools.

## Acceptance criteria

1. `init my-app --monorepo --pm <pm> -y` for pnpm, npm and yarn 1 produces the tree above, and
   `--dry-run` lists the same paths with `+`.
2. In the generated repo, `<pm> install`, `turbo run lint typecheck build`, and
   `node apps/node/dist/main.js` succeed. This is proven in the gated `INIT_E2E=1` suite for each
   manager.
3. `init --monorepo` without `<dir>` exits 1 before any write, with the next-step command.
4. `init my-app` without the flag writes exactly what it writes today; the existing plan and
   e2e tests pass unchanged.
5. The decision superseding 0030's monorepo part exists; `--help` shows `--monorepo` with
   `(default: off)` and an example row; the site docs page for `init` and
   `.harness/docs/system-architecture.md` describe the flag.
6. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass, plus the site sequence if the
   site docs change.

## Trade-offs

| Choice                         | Load-bearing assumption                                           | Fails first when                                                                                       |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Root + `apps/node` (chosen)    | One runnable app is enough to prove turbo's task graph            | A second framework needs per-app ESLint rules that the root config cannot express                      |
| Toolchain once at root         | All apps share one ESLint and Prettier setup, as in design-system | React and Nest need conflicting ESLint presets; shared config packages would then be the migration     |
| Three package managers         | Turbo treats pnpm, npm and yarn 1 workspaces alike                | yarn 1 hoisting or npm workspace quirks break the e2e; each manager is a separate e2e branch to keep   |
| Create mode only               | New repos are the main use case (0030: "kiểu như vite create")     | Users ask to add turbo to an existing workspace; that is a new flow, not a patch                        |

Better approaches: none. The requested direction is the one recommended, because design-system
already proves the root-toolchain Turborepo layout with this toolchain (decision 0014).

## Handoff

Next: plan with the plan skill (`/ak-plan`), then implement through the cooker (`/ak-cook`).
The plan should begin with writing decision 0045, because it changes product policy.

## Root files follow the Turborepo docs

> "turbo.json và package.json cũng như các generated files ở cấp root phải chuẩn đó nha." (user,
> 2026-11-12)

Checked against the official docs on turborepo.dev (pages updated 2026-11-10):
`crafting-your-repository/structuring-a-repository`, `crafting-your-repository/configuring-tasks`
and `reference/configuration`. Where the docs and this repo's conventions differ, the user chose;
those rows are marked.

| Root file             | Standard form                                                                                                                                                                                                                                                                       | Source                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `turbo.json`          | `"$schema": "https://turborepo.dev/schema.json"`; `build` with `dependsOn: ["^build"]` and `outputs: ["dist/**"]`; `lint` and `typecheck` with `dependsOn: ["^build"]` as design-system does; `dev` with `cache: false`, `persistent: true`; a root task `"//#lint:root": {}` | docs, design-system                                          |
| root `package.json`   | `"private": true`; scripts `build`, `dev`, `typecheck` as `turbo run <task>`; `lint` as `turbo run lint lint:root`, with `lint:root` running ESLint on the root's own config files; `format`; `prepare: husky`; `turbo` pinned in `devDependencies`                                   | docs (`//#` root task pattern), design-system                |
| package manager field | top-level `"packageManager": "<pm>@<version>"`, as the single-package preset writes it. The docs call it legacy but still supported; they recommend `devEngines.packageManager`                                                                                                       | user choice, 2026-11-12                                      |
| workspaces            | pnpm: `pnpm-workspace.yaml` with `packages: ["apps/*", "packages/*"]` (no nested `**` globs; the docs say they are unsupported); npm and yarn 1: `"workspaces": ["apps/*", "packages/*"]` in the root `package.json`                                                               | docs                                                         |
| `.gitignore`          | adds `.turbo`. The docs name `.turbo/cache` as the default `cacheDir` but do not say to ignore it; ignoring it is the create-turbo practice                                                                                                                                        | docs (cache location), practice                              |
| typecheck task name   | `typecheck`, not the docs' `check-types`, so both modes share one script name                                                                                                                                                                                                     | user choice, 2026-11-12                                      |
| app package name      | `@my-app/node`: scoped by the root's npm name, with the folder `apps/node`. The docs recommend a namespace prefix and use `@repo` only as an example                                                                                                                                | user choice, 2026-11-12: "Dùng `@my-app/node` nhưng repo folder chỉ là node" |

The plan must prove these forms by running the generated repo, not by reading the templates:
acceptance criterion 2 runs real `turbo` against each package manager, and a template test should
assert the exact root `turbo.json` and `package.json` shape.

## How the Turborepo part is generated: templates in code, not create-turbo

The user asked whether init could run the official `create-turbo` non-interactively instead of
generating files, then align the two outputs, and accepted templates "Nếu turbo repo không có gì
hot, chỉ có kiểu turbo.json, package.json, tsconfig.base.json, packages/, apps/" (user,
2026-11-12). Checked with create-turbo 2.11.11 and a hand-written skeleton:

- `create-turbo <dir> -m <pm> --skip-install --no-git < /dev/null` runs without prompts for pnpm,
  npm and yarn 1. Without `--no-git` it runs `git init` and commits "Initial commit from
  create-turbo", which decision 0031 forbids.
- Its official examples download from `codeload.github.com/vercel/turborepo/tar.gz/main`, so
  pinning create-turbo does not pin the files. `basic` brings two Next.js apps, three packages,
  `AGENTS.md`, `.npmrc`, TypeScript 7 and `check-types`, so aligning means a hard-coded delete and
  rewrite list anyway.
- create-turbo refuses a folder with a conflicting file ("has 1 conflicting file"), so running it
  after `jss-devtools init` is impossible; running it first hits init's monorepo and root
  `tsconfig.json` checks.
- A minimal skeleton is enough: root `package.json`, the workspace field or file, `turbo.json`,
  `tsconfig.base.json`, `apps/node`, `packages/`. With turbo 2.11.10, TypeScript 6.0.3 and
  tsc-alias, `install`, `turbo run build typecheck`, a cached second run (`FULL TURBO`) and
  `node apps/node/dist/main.js` all passed on pnpm 11.24.0, npm 11.19.1 and yarn 1.22.22.

So the Turborepo part is three small templates (`turbo.json`, the root `package.json`, the
workspace globs) plus `tsconfig.base.json`; the toolchain reuses the single-package templates.

Traps the plan must carry:

- yarn 1 ignores a workspace whose `package.json` has no `version` ("Missing version in workspace
  … ignoring"), so `turbo` finds no task and `tsc` is missing (exit 127). The app template sets
  `"version": "0.0.0"`.
- turbo 2.11.11 was under a day old, inside pnpm's `minimumReleaseAge`; the pin goes through
  `scripts/pin-node-preset.mjs` like every other version.
- The Turborepo TypeScript guide says a root `tsconfig.json` is likely unneeded and that root
  changes miss every task's cache; `tsconfig.base.json`, extended by each app as design-system
  does, is not a project and follows that advice.
- The same guide warns that `compilerOptions.paths` can break Just-in-Time internal packages and
  suggests subpath imports. `apps/node` is compiled with tsc-alias, so the `@/` alias stays; a
  future internal package under `packages/` must revisit this.

## Open questions for the plan step

None of these block planning. Ask each one when the plan reaches it:

- Whether `turbo.json` declares a `test` task. The preset ships no test runner, so leaning toward
  leaving it out until one exists.

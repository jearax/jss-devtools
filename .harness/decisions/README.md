# Decisions

User decisions that later work must follow: the only product policy in this repository. Write one
from [`../templates/decision.md`](../templates/decision.md).

| #    | Title                                                                                                                                                    | Status                             | Date       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- |
| 0001 | [The source lives in yyyy and must be clean first](./0001-source-lives-in-yyyy.md)                                                                       | accepted                           | 2026-10-19 |
| 0002 | [ESLint and Prettier, with TypeScript pinned to 6.0](./0002-lint-format-and-typescript.md)                                                               | accepted                           | 2026-10-19 |
| 0003 | [Dependencies follow the Node convention](./0003-dependency-classification.md)                                                                           | accepted                           | 2026-10-19 |
| 0004 | [commander 15 and @clack/prompts 1.8](./0004-cli-parser-and-prompts.md)                                                                                  | accepted                           | 2026-10-19 |
| 0005 | [tsdown 0.23 as the build tool](./0005-build-tool.md)                                                                                                    | accepted                           | 2026-10-19 |
| 0006 | [Node >=22.12 for consumers, tested on 22, 24 and 26](./0006-consumer-node-floor.md)                                                                     | accepted                           | 2026-10-19 |
| 0007 | [Native installation, no npm in CI/CD](./0007-native-installation.md)                                                                                    | accepted                           | 2026-10-19 |
| 0008 | [pnpm 11.24.0, development only](./0008-package-manager.md)                                                                                              | accepted                           | 2026-10-19 |
| 0009 | [vitest 5 as the test runner](./0009-test-runner.md)                                                                                                     | accepted                           | 2026-10-19 |
| 0010 | [New remote jearax/jss-devtools2](./0010-github-remote.md)                                                                                               | superseded                         | 2026-10-19 |
| 0011 | [AgentKit for agent setup, for now](./0011-agent-setup.md)                                                                                               | accepted                           | 2026-10-19 |
| 0012 | [Decision records live in docs/decisions, one file per decision](./0012-decision-records-location.md)                                                    | Superseded by 0040                 | 2026-10-19 |
| 0013 | [jss-devtools2 is a public repository](./0013-repository-visibility.md)                                                                                  | superseded                         | 2026-10-19 |
| 0014 | [One toolchain, modelled on design-system](./0014-toolchain-modelled-on-design-system.md)                                                                | accepted                           | 2026-10-19 |
| 0015 | [No .npmrc and no .nvmrc](./0015-no-npmrc-no-nvmrc.md)                                                                                                   | accepted                           | 2026-10-19 |
| 0016 | [Config files export a named const](./0016-config-export-naming.md)                                                                                      | accepted                           | 2026-10-19 |
| 0017 | [Formatting facts shared by Prettier and editors live only in .editorconfig](./0017-shared-formatting-lives-in-editorconfig.md)                          | accepted                           | 2026-10-19 |
| 0018 | [The installed artifact is a JavaScript bundle that runs on Node](./0018-javascript-bundle-artifact.md)                                                  | accepted                           | 2026-10-19 |
| 0019 | [The release artifact lives in the site image, not in GitHub Releases](./0019-artifact-lives-in-the-site-image.md)                                       | accepted                           | 2026-10-19 |
| 0020 | [The version stays 0.0.1 through development and testing](./0020-version-0-0-1-during-development.md)                                                    | Superseded by 0044                 | 2026-10-19 |
| 0021 | [The home page is a temporary nginx page and install.sh lives in scripts/](./0021-temporary-nginx-home-and-install-script-location.md)                   | accepted                           | 2026-10-19 |
| 0022 | [One Node floor, and CI runs only that version](./0022-one-node-floor.md)                                                                                | superseded                         | 2026-10-19 |
| 0023 | [Exit codes 0 and 1, and CliError for an expected failure](./0023-exit-codes.md)                                                                         | accepted                           | 2026-10-21 |
| 0024 | [A core folder, one folder per command, and role suffixes](./0024-core-and-command-layout.md)                                                            | accepted                           | 2026-10-21 |
| 0025 | [One import alias, @/, and no parent-relative imports](./0025-import-path-alias.md)                                                                      | accepted                           | 2026-10-21 |
| 0026 | [Node floor 24.11.0](./0026-node-floor-24.md)                                                                                                            | accepted                           | 2026-10-21 |
| 0027 | [the landing page is a React SPA built by Vite, the design system is vendored as a tarball](./0027-react-spa-landing-page.md)                            | partly superseded                  | 2026-11-03 |
| 0028 | [Imports carry no file extension](./0028-extensionless-imports.md)                                                                                       | accepted                           | 2026-10-21 |
| 0029 | [The shared command flags](./0029-shared-command-flags.md)                                                                                               | accepted                           | 2026-10-22 |
| 0030 | [The init node preset](./0030-init-node-preset.md)                                                                                                       | partly superseded by 0045 and 0047 | 2026-10-27 |
| 0031 | [init installs the harness](./0031-init-installs-the-harness.md)                                                                                         | accepted                           | 2026-11-01 |
| 0032 | [harness update follows the old prototype's decision 0001 unchanged](./0032-harness-update.md)                                                           | accepted                           | 2026-11-01 |
| 0033 | [harness doctor checks the repository, the machine doctor checks the machine](./0033-harness-doctor.md)                                                  | accepted                           | 2026-11-01 |
| 0034 | [the CLAUDE block follows AgentKit, the folder READMEs do not](./0034-claude-block-follows-agentkit.md)                                                  | accepted                           | 2026-11-02 |
| 0035 | [with AgentKit the harness teaches no plan path, the plan skill decides the layout](./0035-plan-paths-follow-the-agentkit-setting.md)                    | accepted                           | 2026-11-03 |
| 0036 | [the site runs the design system as a Tailwind v4 package, with the design system's own conventions](./0036-site-runs-the-design-system-as-a-package.md) | partly superseded by 0041          | 2026-11-03 |
| 0037 | [the landing page is one English page, and the site carries its own host skin](./0037-the-site-carries-its-own-host-skin.md)                             | accepted                           | 2026-11-04 |
| 0038 | [the site has a router, and the docs are a second route beside the home page](./0038-the-site-has-a-router-and-a-docs-area.md)                           | accepted                           | 2026-11-04 |
| 0039 | [the repository and the image are jss-devtools](./0039-the-repository-and-the-image-are-jss-devtools.md)                                                 | accepted                           | 2026-11-04 |
| 0040 | [The repository runs on its own harness](./0040-the-repository-runs-on-its-own-harness.md)                                                               | Accepted                           | 2026-11-09 |
| 0041 | [the site runs the stable @jjuidev/styles and @jjuidev/react packages](./0041-the-site-runs-the-stable-design-system-packages.md)                        | accepted                           | 2026-11-09 |
| 0042 | [Site UI work is delegated, but every value comes from the design system](./0042-site-ui-stays-inside-the-design-system.md)                              | Accepted                           | 2026-11-10 |
| 0043 | [JSX renders optional parts with && and groups attributes that share one condition](./0043-conditional-rendering-in-jsx.md)                              | Accepted                           | 2026-11-10 |
| 0044 | [The version moves to 0.1.0 for the first feature release](./0044-the-version-moves-to-0-1-0.md)                                                         | Accepted                           | 2026-11-10 |
| 0045 | [init --monorepo creates a Turborepo with one app under apps/<framework>](./0045-init-monorepo-creates-a-turborepo.md)                                   | Accepted                           | 2026-11-12 |
| 0046 | [init formats every file it writes with the project's own Prettier](./0046-init-formats-the-files-it-writes.md)                                          | Accepted                           | 2026-11-12 |
| 0047 | [init --framework nest copies the ESM Nest 12 app kept in templates/nest/](./0047-init-nest-preset.md)                                                   | Accepted                           | 2026-11-12 |
| 0048 | [Local installs give every template its dependencies; CI and production never install them](./0048-template-deps-install-on-demand.md)                   | Accepted                           | 2026-11-13 |
| 0049 | [The Nest preset answers every JSON response as { status, message, data }, in the request's language](./0049-nest-response-envelope.md)                  | Accepted                           | 2026-11-13 |

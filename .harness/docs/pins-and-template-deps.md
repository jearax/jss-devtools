# Pins and template dependencies

Traps in pinning the toolchain and installing the templates' `node_modules`. Policy lives in
decisions [0008](../decisions/0008-package-manager.md) and
[0048](../decisions/0048-template-deps-install-on-demand.md).

- `scripts/pin-node-preset.mjs` writes the constants file itself; a rerun moves pins that aged past `minimumReleaseAge`, and the repo's own prettier follows the preset (test-asserted). (src: scripts/pin-node-preset.mjs)
- A caret on a version younger than `minimumReleaseAge` makes pnpm silently write `minimumReleaseAgeExclude` (entries need quotes: a bare `@` breaks YAML); pin an aged version through the pin script instead of keeping it. (src: scripts/pin-helpers.mjs)
- pnpm 11 skips the root `prepare` (and so template installs) when an install changes nothing, and `pnpm exec` in a folder without `node_modules` runs it as a side effect; after `template:clean` or a pin, run `pnpm template:install`. (src: scripts/template-deps.mjs)
- `pnpm exec` in a generated template project runs a verify-deps auto-install that prunes the merged toolchain out of `node_modules`; run template checks through `node_modules/.bin/<tool>` binaries instead.
- The pin script resolves one version per package across every preset, so a peer range in one template's dependency steps a shared pin down for all of them: a plugin capped at ESLint 9 would move ESLint for `node` and `nest` too. Read the peer ranges before adding a package to a template's list: a mismatch the pin script is made to skip still fails the generated project's install on npm (`ERESOLVE`) and on pnpm (`strictPeerDependencies`), and only warns on yarn 1 and bun. (src: scripts/pin-node-preset.mjs)
- pnpm `strictPeerDependencies` errors on peer version conflicts only; a missing peer is auto-provided (rolldown for `@rolldown/plugin-babel`), so a package need not be listed unless a conflict appears. (src: templates/react/package.json)
- A build script pnpm has not decided on is written into `pnpm-workspace.yaml` as a literal `esbuild: set this to true or false` under `allowBuilds`; delete the line or decide it, never commit it as written.
- A pin run that moves an aged pin fails three kinds of test, none of them a logic failure: `tests/harness-markdown-format.test.ts` (the repo's own Prettier must equal the preset's: bump it in the root `package.json`), the `package.json` snapshot in `tests/node-preset-templates.test.ts` (update that file's snapshot), and any test holding a version as a literal (read it from the constant or the template's manifest instead). (src: tests/node-preset-templates.test.ts)
- A template's `define` constant that no module imports is dropped from `dist/cli.mjs` by the bundler, while vitest still sees it: the bundle carries a template only once a plan service imports its constant, so prove the embedding on the built file. (src: tsdown.config.ts)
- A template is embedded as UTF-8 text and a plan entry's content is a string, so a binary file under `templates/<framework>/` (an image, a font) reaches the generated project corrupted. (src: scripts/framework-template.mjs)

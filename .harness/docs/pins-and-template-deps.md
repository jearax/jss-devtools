# Pins and template dependencies

Traps in pinning the toolchain and installing the templates' `node_modules`. Policy lives in
decisions [0008](../decisions/0008-package-manager.md) and
[0048](../decisions/0048-template-deps-install-on-demand.md).

- `scripts/pin-node-preset.mjs` writes the constants file itself; a rerun moves pins that aged past `minimumReleaseAge`, and the repo's own prettier follows the preset (test-asserted). (src: scripts/pin-node-preset.mjs)
- A caret on a version younger than `minimumReleaseAge` makes pnpm silently write `minimumReleaseAgeExclude` (entries need quotes: a bare `@` breaks YAML); pin an aged version through the pin script instead of keeping it. (src: scripts/pin-helpers.mjs)
- pnpm 11 skips the root `prepare` (and so template installs) when an install changes nothing, and `pnpm exec` in a folder without `node_modules` runs it as a side effect; after `template:clean` or a pin, run `pnpm template:install`. (src: scripts/template-deps.mjs)
- `pnpm exec` in a generated template project runs a verify-deps auto-install that prunes the merged toolchain out of `node_modules`; run template checks through `node_modules/.bin/<tool>` binaries instead.

# React template traps

Facts about `templates/react/` that cost real time when missed. Each names the file that proves it.
Policy lives in decision [0057](../decisions/0057-init-react-preset.md).

## Lint and types

- ESLint 10 does not expand a single-element brace group in config globs: `{src}/**/*` matches
  nothing ("no matching configuration"), while `{src,test}` works. With one source folder, write
  `src/**/*` (`templates/react/eslint.config.mjs`).
- `eslint-plugin-react-refresh` 0.5.7 exports `configs.vite` as a config object, not a function;
  calling it crashes the ESLint config load (`templates/react/eslint.config.mjs`).
- A conditional prop type over a generic (`ComponentProps<C>` with `C extends ElementType`)
  collapses to `any` when destructured or passed to `createElement`, and trips
  `no-unsafe-argument`. Keep the public type and render through JSX spread; with `NoInfer` on the
  element's props, `as` is the only inference site and the spread needs no cast
  (`templates/react/src/components/Polymorphic/Polymorphic.tsx`).
- Moving a folder changes the alphabet the import order sorts by: after a rename like `layouts/` into
  `components/layouts/`, `import-x/order` fails in the files that import it, and only a generated
  app catches it — the repository never lints into `templates/`. After any template move, generate
  an app and lint it before folding the template back
  (`templates/react/src/router/router.tsx`, proven by the illustrators and layouts moves).
- The `no-empty-object-type` option for allowing an interface with one extends is
  `allowInterfaces: 'with-single-extends'` in typescript-eslint 8; the old `allowSingleExtends`
  spelling (from `no-empty-interface`) fails ESLint's config schema at load time
  (`templates/react/eslint.config.mjs`).
- typescript-eslint's `no-empty-object-type` rejects an interface that only extends another
  (`interface XProps extends PropsWithChildren {}`) unless `allowInterfaces: 'with-single-extends'` is set, which the
  template's ESLint sets for its children-only wrappers
  (`templates/react/eslint.config.mjs`).
- The react-hooks preset enforces the React Compiler rule against creating a component during
  render ("Components created during render will reset their state"): a `Providers` that builds a
  composed component in its body fails lint. Nest the provider elements instead — `reduceRight`
  over the list wrapping `children` — and pass the provider list as a prop from `App.tsx`
  (`templates/react/src/components/Providers/Providers.tsx`).
- `@openfeature`'s `TypedInMemoryProvider` requires a `disabled` property per flag; `as const`
  keeps `defaultVariant` at its literal union
  (`templates/react/src/contexts/FeatureFlags/FeatureFlags.config.ts`).

## Build and install

- Vite 8 resolves the tsconfig `@/` paths through `resolve.tsconfigPaths: true`; an unresolved
  alias fails `vite build`, so a green build proves the alias (`templates/react/vite.config.ts`).
- npm 11 warns that esbuild's postinstall is not approved by `allowScripts`; the build still
  passes, because rolldown runs a Vite 8 build, not esbuild.
- Traps every template shares (a pin run moves the pins of all presets, an unimported template
  constant is dropped from the bundle, peers, binary files): see
  [pins-and-template-deps.md](./pins-and-template-deps.md).

## Substitution and proof

- In a `--monorepo` app, yarn and npm hoist `vite` to the workspace root while pnpm and bun keep it
  in `apps/react/node_modules`: a script that spawns the vite binary must try the app folder and
  then the root (`tests/init-react.e2e.test.ts`).
- The project name is a folder name, and `String.replace` reads `$&`, `$1` and friends in a string
  replacement as patterns while `&`, `<` and `>` break the title markup unescaped: substitute
  through a replacer function with the name HTML-escaped, `&` first
  (`src/commands/init/services/react-plan.service.ts`, `tests/react-plan.service.test.ts`).
- `getCacheForType` proves nothing about the React Compiler — React itself carries that name. The
  marker is `memo_cache_sentinel` inside a page chunk under `dist/assets/`; the e2e scans the
  chunk files for it (`tests/init-react.e2e.test.ts`).

## Site docs

- The docs constants carry code between backticks and `RichText` turns each pair into a `code`
  element, so the rendered text never holds a backtick: a docs-page test must match the text
  without them (`site/src/pages/Docs/components/RichText/RichText.tsx`,
  `site/src/pages/Docs/pages/React/React.test.tsx`).

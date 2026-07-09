# ESLint 9 Migration Notes

Notes for the future ESLint 9.x edition (planned v1.0). Captures decisions and
packages removed during the ESLint 8.x line so nothing is lost.

## Packages removed (ESLint 8.x flat config)

These were removed because the `typescript-eslint` meta-package already bundles
them, and our flat config only imports the meta-package:

- `@typescript-eslint/parser` — was in `peerDependencies`, `setup-pkgs.ts`
  install list, and `build.ts` `EXTERNAL_DEPS`.
- `@typescript-eslint/eslint-plugin` — same three locations.

**Re-add them if** a future ESLint 9 setup needs parser/plugin declared
separately (e.g. for legacy `.eslintrc` compatibility or plugin composition).

## ESLint 8 compatibility matrix (reference)

Each package's latest version and whether it supports ESLint `^8.57.0`. This
drove the `peerDependencies` OR-range choices.

| Package | ESLint 8 peer? | Range we declare |
|---------|----------------|------------------|
| `typescript-eslint` | v8 supports `^8.57` | `^6 \|\| ^7 \|\| ^8` |
| `@eslint/js` | only v8 for eslint 8 | `^8` |
| `eslint-plugin-react-hooks` | v4–v7 all ok | `^4 \|\| ^5 \|\| ^6 \|\| ^7` |
| `eslint-plugin-react-native` | v5 is latest | `^4 \|\| ^5` |
| `eslint-plugin-tailwindcss` | v4 needs eslint 9/10 — eslint 8 must use v3 | `^3` |
| `eslint-plugin-storybook` | `>=8` | `>=0.8.0` |
| `@next/eslint-plugin-next` | no eslint peer | `^14 \|\| ^15 \|\| ^16` |

## Moving to ESLint 9

- `eslint` peer: relax `^8.0.0` → `^8.57.0 || ^9.0.0`.
- `@eslint/js`: relax to `^8.0.0 || ^9.0.0` (v9 supports eslint 9).
- `eslint-plugin-tailwindcss`: can move to `^4` (v4 needs eslint 9/10).
- Re-evaluate whether parser/plugin need declaring separately under v9.
- `resolveVersion`/`isVersionInRange` already support OR ranges, so widening
  these ranges requires no logic changes.

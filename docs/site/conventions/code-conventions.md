# Code Conventions

> Adapted from `@jjuidev/design-system`'s `docs/conventions/code-conventions.md`. The site has no
> hooks, no services and no routers, so their rules are left out.

Tooling enforces what it can: ESLint (`site/eslint.config.mjs`), Stylelint
(`site/stylelint.config.mjs`) and Prettier, which the repository root owns. When a rule here
disagrees with the tooling, the tooling wins until both are updated together.

## General

- Imports: every import in `src/` goes through the `@/` alias. Only CSS is imported relatively. A
  type is imported with a plain `import`, never `import type`; ESLint `consistent-type-imports`
  rejects `import type` in `src/`.
- Import order: packages, then `@/`, then the relative imports, CSS last, with a blank line
  between the groups. ESLint `import-x/order` enforces it.
- The exception: `vite.config.ts`, `vitest.config.ts` and `vite/*.ts` are loaded by Vite's config
  loader, which runs in Node before any resolver is configured. They use relative imports with the
  `.ts` extension and `import type` for type-only imports. `CONFIG_LOADER_FILES` in
  `site/eslint.config.mjs` lists them.
- Comments: only to explain non-obvious logic. No JSDoc, no section comments, no rule labels.
- Functions are arrow functions with a block body and an explicit `return`. ESLint
  `prefer-arrow-functions` and `arrow-body-style` enforce it.
- Promises are `async`/`await` with `try`/`catch`. A promise that is not awaited is marked `void`.
  ESLint `no-floating-promises` and `no-misused-promises` enforce it.
- Config files assign to a named constant and default-export it.

## Naming

| Item      | Convention                                                | Example       |
| --------- | --------------------------------------------------------- | ------------- |
| Functions | camelCase verb                                            | `handleClick` |
| Variables | camelCase                                                 | `isLoading`   |
| Constants | UPPER_SNAKE_CASE, only for a value the developer declares | `MAX_RETRY`   |
| Enum-like | `as const` object plus a derived union type               | `UserRole`    |
| Types     | PascalCase noun, with a role suffix where one applies     | `HomeProps`   |

- No TypeScript `enum`; ESLint rejects it. Use an `as const` object and derive the union type.

## Types

- An object type is a `type`: props, options, results and unions.
- An `interface` is used where a `type` cannot do the job: extending another props type, or
  augmenting a library type through declaration merging.
- No `I` or `T` prefix.

## Exports

- Default export: components, pages and anything rendered as a React component. Everything else is
  a named export: types, variants, utilities and constants.
- The constant is declared first, then default-exported; ESLint `import-x/no-anonymous-default-export`
  rejects an anonymous default export.

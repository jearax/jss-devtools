# Site conventions

The rules the landing page in `site/` follows. Every file here is adapted from the stable design
system's conventions (its `.harness/docs/` in the design system repository, decisions
0044–0053); each one says what the site leaves out.

| Document                                                           | Covers                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| [folder-structure-conventions.md](folder-structure-conventions.md) | The `site/src` tree, file naming, the `@/` alias      |
| [component-conventions.md](component-conventions.md)               | Folder anatomy, the component API, component code     |
| [code-conventions.md](code-conventions.md)                         | Imports, functions, naming, types, exports            |
| [styling-conventions.md](styling-conventions.md)                   | CSS Modules, `@apply`, the tokens the package carries |
| [testing-conventions.md](testing-conventions.md)                   | Vitest Browser Mode, what a test asserts              |

The site leaves out what it does not have: no feature flags, no authentication, no Base UI, no
Storybook, no end-to-end tests and no coverage gate. The files
below say so where it matters.

The design system is a package, so its tokens, colours, skins, text roles and class helpers are
used, never copied. The packages export `cn` and `tv`, so the site imports them from
`@jjuidev/styles/variants` and copies nothing.

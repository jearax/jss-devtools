# Folder Structure Conventions

> Adapted from `@jjuidev/design-system`'s `docs/conventions/folder-structure-conventions.md`. The
> site has a router but no feature folders, no services, no contexts of its own and no end-to-end
> tests, so those parts of the design system's tree are left out.

## Tree

```text
site/
├── eslint.config.mjs          # the site's own ESLint rules
├── stylelint.config.mjs       # the site's own Stylelint rules
├── vite/                      # Vite plugins that are not part of the app
│   └── tailwind-auto-reference.plugin.ts
├── vite.config.ts             # Vite + React + Tailwind, the `@/` alias, the readable CSS Module names in dev
├── vitest.config.ts           # Vitest Browser Mode, merges the Vite config
├── vitest.setup.ts            # the test setup: vitest-browser-react and the global stylesheet
├── index.html                 # the document shell; sets the theme and the skin before the first paint
├── src/
│   ├── main.tsx               # the only file at the src/ root: the theme provider, the router, the React root
│   ├── components/            # the parts two routes share, one PascalCase folder each; `ls` lists the rest
│   │   ├── AppRouter/         # the route tree: the layout, the home page, the docs area, the 404
│   │   ├── CodeBlock/         # a file or shell snippet, with the hand-written colouring
│   │   ├── Layout/            # the shell: the skip link, the header, the outlet, the search palette
│   │   ├── ShellPrompt/       # the robbyrussell prompt every command is typed at
│   │   ├── ShellCommand/      # a command coloured as zsh colours it
│   │   ├── SiteHeader/
│   │   └── Terminal/          # a terminal window with the CLI's real output
│   ├── constants/             # the facts two routes state, one file per group of values
│   │   ├── cli.constant.ts    # the product's own facts: the name, the install command, the Node floor
│   │   ├── routes.constant.ts # the routes, the navigation and the docs pages, in one place
│   │   └── transcripts.constant.ts # the CLI's real output, captured from the built bundle
│   ├── pages/                 # route-level components, one PascalCase folder each
│   │   ├── Home/
│   │   │   ├── Home.tsx
│   │   │   ├── Home.constant.ts     # the page's own words and the hero terminal's tabs
│   │   │   ├── Home.test.tsx
│   │   │   ├── styles.module.css
│   │   │   ├── constants/           # values that outgrew Home.constant.ts
│   │   │   └── components/          # the page's own components, one PascalCase folder each
│   │   │       ├── ClaudeCodeScreen/ # the Claude Code session the hero terminal shows
│   │   │       ├── CommandsBand/    # the three commands
│   │   │       ├── FileTree/        # what init writes into a repository
│   │   │       └── Hero/            # the headline, the install block, the terminal
│   │   ├── Docs/
│   │   │   ├── Docs.tsx             # the docs layout: the sidebar and the outlet
│   │   │   ├── Docs.route.ts        # the docs routes, lazy one by one, built fresh for every router
│   │   │   ├── Docs.constant.ts     # the facts only the docs state
│   │   │   ├── Docs.test.tsx
│   │   │   ├── components/          # the page template, the sidebar, the pager, the jump to a hash
│   │   │   ├── hooks/               # the section being read, and the URL hash that follows it
│   │   │   └── pages/               # one folder per docs page
│   │   └── NotFound/
│   │       ├── NotFound.tsx
│   │       └── styles.module.css
│   ├── styles/
│   │   ├── styles.css         # the Tailwind entry: the engine, the package's source entry, then the skin
│   │   └── skins/             # the site's own skin: the scale values and the typed definition
│   │       ├── jss-devtools.css
│   │       ├── jss-devtools.skin.ts
│   │       └── jss-devtools.skin.test.tsx
└── vendor/                    # the design system tarballs the site installs from
```

- `src/main.tsx` is the only file at the `src/` root. Everything else lives in a folder.
- A page folder holds `<Name>.tsx`, its constants `<Name>.constant.ts`, its test `<Name>.test.tsx`
  and its `styles.module.css`.
- A page whose values outgrow one file splits them into `constants/`, one `<name>.constant.ts` per
  group. A value another route states as well does not live in the page: it lives in
  `src/constants/`, so the two cannot drift apart. The Node floor is such a value, and the root
  test reads it from `src/constants/cli.constant.ts`.
- A page that grows past one screen puts its parts in `components/<Name>/<Name>/`, each with its
  own `styles.module.css` and its own test. The page component then only composes them.
- The site's skin lives under `src/styles/`, next to the Tailwind entry that imports it. The
  `tailwindAutoReference` plugin leaves `src/styles/` alone, so a skin is never given an
  `@reference` to the entry that imports it.
- The site has a router: `components/AppRouter/` holds the route tree, and a route's page is a
  folder under `pages/`. The docs area is lazy route by route, because the router matches the paths
  before it loads anything and a lazy route cannot bring its own children. Each docs page is its
  own chunk, and the home route ships none of them.
- The route tree is a factory, not a constant: the router consumes a route object as it loads it,
  so a shared tree would hand the second router a tree with its thunks already spent.
- A part two routes share lives in `components/`, and a value two routes share lives in
  `constants/`.

## File Naming

| Kind                                                       | Pattern              | Example                                |
| ---------------------------------------------------------- | -------------------- | -------------------------------------- |
| A page or a component folder                               | `<Name>/<Name>.tsx`  | `pages/Home/Home.tsx`                  |
| A file inside a folder named after the folder's own module | `<Name>.<kind>.tsx`  | `pages/Home/Home.test.tsx`             |
| The constants of a page                                    | `<Name>.constant.ts` | `pages/Home/Home.constant.ts`          |
| Every other file                                           | `<name>.<kind>.ts`   | `constants/commands.constant.ts`       |
| Hooks                                                      | `use<Name>.ts`       | `pages/Docs/hooks/useActiveSection.ts` |

- The kind is the singular of the folder it lives in: a file in a `utils/` folder is a
  `<name>.util.ts`.
- A file that carries its folder's module name keeps the PascalCase spelling (`Home.test.tsx`);
  any other name is kebab-case.
- Exempt entry files: `src/main.tsx`, `src/styles/styles.css` and the root config files.

## Imports

- Every import in `src/` goes through the `@/` alias, a sibling file included. Only CSS is
  imported relatively.
- The alias is declared once, in `site/tsconfig.json`; Vite reads it through
  `resolve.tsconfigPaths`, and ESLint rejects a relative import that is not CSS.

```text
// Do
import Home from '@/pages/Home/Home';
import { cn } from '@jjuidev/styles/variants';
import styles from './styles.module.css';

// Avoid
import Home from '../Home/Home';
```

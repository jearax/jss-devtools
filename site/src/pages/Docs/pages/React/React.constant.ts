import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the react page. The page asks for them by id, and the search index and the
 * site test read this list, so a heading is declared once and never written out twice.
 */
export const REACT_SECTIONS = [
	{
		id: 'what-it-writes',
		title: 'What it writes'
	},
	{
		id: 'the-environment',
		title: 'The environment'
	},
	{
		id: 'the-conventions',
		title: 'The conventions'
	},
	{
		id: 'the-scripts',
		title: 'The scripts'
	},
	{
		id: 'the-monorepo',
		title: 'The monorepo'
	},
	{
		id: 'what-is-not-there-yet',
		title: 'What is not there yet'
	}
] as const;

export type ReactSectionId = (typeof REACT_SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: ReactSectionId): SectionMeta => {
	return sectionMeta(REACT_SECTIONS, id);
};

/** The `src/` tree `init --framework react` writes, read from `templates/react/src`. */
export const REACT_TREE = `src/
  App.tsx
  main.tsx
  components/
    ErrorBoundary/ErrorBoundary.tsx
    ErrorState/ErrorState.tsx
    Polymorphic/Polymorphic.tsx
    Providers/Providers.tsx
    RouteErrorBoundary/RouteErrorBoundary.tsx
    layouts/
      MainLayout/
        MainLayout.tsx
        Footer/Footer.tsx
        Header/Header.tsx
        Sidebar/Sidebar.tsx
        SideNav/SideNav.tsx
  contexts/
    FeatureFlags/FeatureFlags.config.ts
    FeatureFlags/FeatureFlags.tsx
  hocs/
    AuthGuard/AuthGuard.tsx
    GuestOnlyRoute/GuestOnlyRoute.tsx
  hooks/
    useAuth/useAuth.ts
  pages/
    auth/
      Login/Login.tsx
    illustrators/
      BadRequest/BadRequest.tsx
      NotFound/NotFound.tsx
      ServerError/ServerError.tsx
    Dashboard/Dashboard.tsx
    Home/Home.tsx
  router/
    router.tsx
    routes.constant.ts
  services/
    error-reporting.service.ts
  vite-env.d.ts`;

/** One row of the environment table: the variable, its default in the example env file, and what it does. */
export type ReactEnvRow = {
	name: string;
	/** The value the example env file ships; an empty string is a variable the example leaves unset. */
	default: string;
	meaning: string;
};

/**
 * The environment variables, read from the template's example env file. `tests/site-react-docs.test.ts`
 * asserts this table stays equal to that file, in the same order with the same defaults.
 */
export const REACT_ENV_ROWS: readonly ReactEnvRow[] = [
	{
		name: 'VITE_FEATURE_SIDEBAR',
		default: 'true',
		meaning: 'Seeds the default variant of the sidebar flag: `false` boots with the sidebar off, anything else on.'
	}
];

/** The paragraphs of the environment section, rendered through `RichText`. */
export const REACT_ENV_PARAGRAPHS: readonly string[] = [
	'The app reads its environment through `import.meta.env`: Vite inlines every `VITE_`-prefixed variable into the build. A variable that is not set is `undefined` where the code reading it picks a fallback, so the app boots without an env file.',
	'Because the values are inlined at build time, a changed variable needs a rebuild, not only a restart.'
];

/** The paragraphs of the conventions section, rendered through `RichText`. */
export const REACT_CONVENTIONS_PARAGRAPHS: readonly string[] = [
	'`zustand` state lives beside its hook: a `useXXX.ts` file holds the `useXXXStore` store as a named export, written first, and the `useXXX` hook as the default export. The hook selects through `useShallow`, so a selector that builds an object does not re-render its component on every store change.',
	'A context is consumed with React\u2019s `use(Context)` instead of `useContext(Context)`, the React 19 way to read one.',
	'A provider that needs props gets its own small wrapper component that supplies them and passes the children through; the provider list in `App.tsx` stays uniform, one provider per line.'
];

/** The `scripts` block of the generated `package.json`, read from `templates/react/package.json`. */
export const REACT_SCRIPTS = `{
  "build": "tsc -b && vite build",
  "dev": "vite",
  "format": "npm run lint:fix && prettier --write .",
  "lint": "eslint \\"src/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
  "lint:fix": "eslint --fix \\"src/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
  "prepare": "husky",
  "preview": "vite preview",
  "typecheck": "tsc -b"
}`;

/** The paragraphs of the monorepo section, rendered through `RichText`. */
export const REACT_MONOREPO_PARAGRAPHS: readonly string[] = [
	'With `--monorepo`, the app lands at `apps/react` as the workspace `@my-app/react`. The toolchain and the harness stay at the root, and every root script runs the app through turbo as in the node and nest presets. Listed with others, `--framework nest,react`, it sits beside them under `apps/`.',
	'The preset only creates a project: setting up an existing folder with `--framework react` exits 1 and names the create command.'
];

/** The paragraphs of the what-is-not-there-yet section, rendered through `RichText`. */
export const REACT_NOT_THERE_PARAGRAPHS: readonly string[] = [
	'The example feature the nest preset ships is not here: there is no sample to leave out with `--no-sample`, and no test runner, so the generated app carries no `test` script.',
	'Tailwind and every other styling stack are out too: the template ships no stylesheet at all, so the pages are unstyled markup until a decision adds one.'
];

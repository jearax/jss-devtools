import { SectionMeta, sectionMeta } from '@/pages/Docs/Docs.constant';

/**
 * The sections of the init page. The page asks for them by id, and the search index reads this
 * list, so a heading is declared once and never written out twice.
 */
export const SECTIONS = [
	{
		id: 'what-it-does',
		title: 'What it does'
	},
	{
		id: 'the-flow',
		title: 'The flow'
	},
	{
		id: 'the-options',
		title: 'The options'
	},
	{
		id: 'the-files',
		title: 'The files it writes'
	},
	{
		id: 'the-monorepo',
		title: 'The monorepo'
	},
	{
		id: 'the-scripts',
		title: 'The scripts it writes'
	},
	{
		id: 'the-presets',
		title: 'The presets'
	},
	{
		id: 'the-dry-run',
		title: 'The dry run'
	}
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The metadata of one section of this page. */
export const meta = (id: SectionId): SectionMeta => {
	return sectionMeta(SECTIONS, id);
};

export type InitCommand = {
	code: string;
	title: string;
	label: string;
	prompt: {
		dir: string;
		git?: boolean;
	};
};

/**
 * The commands the page renders as copyable code blocks: the two create forms and the dry run.
 */
export const INIT_COMMANDS: readonly InitCommand[] = [
	{
		code: 'jss-devtools init my-app --pm pnpm',
		title: 'a new project',
		label: 'Copy the init command',
		prompt: {
			dir: '~',
			git: false
		}
	},
	{
		code: 'jss-devtools init',
		title: 'the current folder',
		label: 'Copy the init command',
		prompt: {
			dir: 'my-app'
		}
	},
	{
		code: 'jss-devtools init my-app --pm pnpm --dry-run',
		title: 'dry run',
		label: 'Copy the dry-run command',
		prompt: {
			dir: '~',
			git: false
		}
	}
];

/** The paragraphs of the monorepo section, rendered through `RichText`. */
export const INIT_MONOREPO_PARAGRAPHS: readonly string[] = [
	'With `--monorepo`, create mode builds a Turborepo instead of a single package. The toolchain and the harness are written once, at the root, next to a `turbo.json` and a `tsconfig.base.json`. One app lives at `apps/node`, named after `--framework`, as the workspace `@my-app/node`, and an empty `packages/` waits for shared code. Every script at the root runs through `turbo run`.',
	'The flag is create mode only, and works with every manager: bun, pnpm, yarn 1 and npm. Without it, `init` writes exactly what it always has, and an existing project keeps the single-package flow.'
];

/** The intro of the what-it-does section, rendered through `RichText`. */
export const INIT_WHAT_IT_DOES =
	'With a folder name, `init` creates a new project. Without one, it sets up the folder you are in. The two paths differ in what they read, not in what they write: the same toolchain either way.';

/** The intro of the files section, rendered through `RichText`. */
export const INIT_FILES_INTRO =
	'A new project gets the toolchain, the git hooks and the editor settings. These are the files `init` owns, and it will not overwrite the three it considers its own \u2014 `eslint.config.mjs`, `.prettierrc.json` and `commitlint.config.mjs` \u2014 unless you pass `--force`.';

/** The closing note of the files section, rendered through `RichText`. */
export const INIT_FILES_NOTE =
	'With `--pm pnpm` the project also gets a `pnpm-workspace.yaml`, and with the harness installed it gets the `.harness/` folder and the hook entries in `.claude/settings.json`.';

/** The steps of the flow section, rendered through `RichText`. */
export const INIT_FLOW_STEPS: readonly string[] = [
	'The preflight reads the folder and the machine, and refuses what it cannot do: a folder that already holds a project, a config `init` owns that is already there.',
	'The plan is built and printed. Every file it would write is listed with what it would do to it.',
	'You confirm it. `--yes` skips the question, which is what a CI job needs.',
	"The files are written, the packages are installed with the chosen manager, `package.json` is sorted, and every written file is formatted with the project's own Prettier."
];

/** What can still fail after the writes, rendered through `RichText`. */
export const INIT_FLOW_AFTER =
	'After that, `git init`, the install, the sort and the format can each still exit 1. When one does, the files are already written: the command says so and prints the command to finish the step by hand.';

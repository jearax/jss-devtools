export type InitOption = {
	flag: string;
	meaning: string;
};

/**
 * The `init` options, from `jss-devtools init --help`.
 */
export const INIT_OPTIONS: readonly InitOption[] = [
	{
		flag: 'dir',
		meaning: 'Folder for a new project. Omit it to set up the current folder.'
	},
	{
		flag: '--framework <name>',
		meaning:
			'The preset to apply. `node` and `nest` work; `react`, `rn` and `next` are declared but not implemented. `nest` creates a new project only — an existing folder refuses it.'
	},
	{
		flag: '--pm <name>',
		meaning: 'The package manager for a new project: `bun`, `pnpm`, `yarn` or `npm`. Defaults to `npm`.'
	},
	{
		flag: '--monorepo',
		meaning:
			'Create the project as a Turborepo: the toolchain and the harness at the root, one app under `apps/<framework>`, and an empty `packages/`. Create mode only, default off.'
	},
	{
		flag: '--force, -f',
		meaning:
			'Replace the existing ESLint, Prettier, commitlint and editor configs. Without it, `init` stops and lists them.'
	},
	{
		flag: '--no-vscode',
		meaning: 'Do not write `.vscode/`. It is written by default.'
	},
	{
		flag: '--no-harness',
		meaning: 'Do not install the harness. It is installed by default.'
	},
	{
		flag: '--agent-kit',
		meaning: 'Point AgentKit at `.harness/docs` and `.harness/plans`. Needs `ak`.'
	},
	{
		flag: '--yes, -y',
		meaning: 'Skip the questions and use the defaults.'
	},
	{
		flag: '--dry-run',
		meaning: 'Show what would change. Nothing is written and nothing is installed.'
	}
];

export type ExitCode = {
	code: string;
	meaning: string;
	also?: {
		command: string;
		meaning: string;
	};
};

/**
 * The exit codes, from `src/core/constants/exit-code.constant.ts` and `jss-devtools harness doctor --help`.
 */
export const EXIT_CODES: readonly ExitCode[] = [
	{
		code: '0',
		meaning: 'The command succeeded.',
		also: {
			command: 'harness doctor',
			meaning: 'returns 0 when the harness has warnings only.'
		}
	},
	{
		code: '1',
		meaning: 'The command failed.',
		also: {
			command: 'harness doctor',
			meaning: 'returns 1 when any check fails.'
		}
	}
];

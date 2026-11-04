import { SOURCE_URL } from '@/constants/cli.constant';

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
		meaning: 'The preset to apply. Only node works today; react, rn, next and nest are declared but not implemented.'
	},
	{
		flag: '--pm <name>',
		meaning: 'The package manager for a new project: bun, pnpm, yarn or npm. Defaults to npm.'
	},
	{
		flag: '--force, -f',
		meaning:
			'Replace the existing ESLint, Prettier, commitlint and editor configs. Without it, init stops and lists them.'
	},
	{
		flag: '--no-vscode',
		meaning: 'Do not write .vscode/. It is written by default.'
	},
	{
		flag: '--no-harness',
		meaning: 'Do not install the harness. It is installed by default.'
	},
	{
		flag: '--agent-kit',
		meaning: 'Point AgentKit at .harness/docs and .harness/plans. Needs ak.'
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

/**
 * Where the repository keeps what the page points at. The repository's address is the one
 * constant, so a link can never point at a name the repository has moved away from.
 */
export const REFERENCE_LINKS: readonly { label: string; href: string }[] = [
	{
		label: 'The repository',
		href: SOURCE_URL
	},
	{
		label: 'The project overview',
		href: `${SOURCE_URL}/blob/main/docs/project-overview-pdr.md`
	},
	{
		label: 'The architecture',
		href: `${SOURCE_URL}/blob/main/docs/system-architecture.md`
	},
	{
		label: 'The decisions',
		href: `${SOURCE_URL}/tree/main/docs/decisions`
	}
];

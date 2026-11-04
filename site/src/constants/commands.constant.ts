/**
 * The three commands, from `src/commands/`. The summary is the command's own description; the
 * details are what the command actually does.
 */
export type CommandInfo = {
	name: string;
	/** The docs page that explains the command. */
	slug: string;
	/** The command line the reader runs. */
	command: string;
	summary: string;
	details: string;
};

export const COMMANDS: readonly CommandInfo[] = [
	{
		name: 'init',
		slug: 'init',
		command: 'jss-devtools init my-app --pm pnpm',
		summary: 'Create a project, or set up the current one.',
		details:
			'Writes the toolchain: TypeScript, ESLint, Prettier, commitlint, git hooks, the editor settings, and the harness. Every check runs before the first write, and the whole plan is shown before anything is written.'
	},
	{
		name: 'doctor',
		slug: 'doctor',
		command: 'jss-devtools doctor',
		summary: 'Check Node.js, git and the package managers.',
		details:
			'Reads the machine and reports every check with its own fix. A package manager that is only missing is shown, not failed. Exits 1 when a check fails.'
	},
	{
		name: 'harness',
		slug: 'harness',
		command: 'jss-devtools harness doctor',
		summary: 'Manage the repository harness.',
		details:
			'Two subcommands: `harness doctor` checks the harness installed in this repository, `harness update` brings it to the installed CLI version and keeps your edits.'
	}
];

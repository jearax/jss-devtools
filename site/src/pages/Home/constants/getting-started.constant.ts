import { INSTALL_COMMAND } from '@/constants/cli.constant';
import { COMMANDS } from '@/constants/commands.constant';
import { docsHref } from '@/constants/routes.constant';

export type Step = {
	/** What the step does. */
	title: string;
	/** The command the reader runs. */
	command: string;
	/** What the copy button says it copies, for the screen reader. */
	copyLabel: string;
	/** The docs page that explains the step in full. */
	href: string;
};

const COMMANDS_BY_NAME = new Map(
	COMMANDS.map((command) => {
		return [command.name, command];
	})
);

const commandFor = (name: string): string => {
	const command = COMMANDS_BY_NAME.get(name);

	if (command === undefined) {
		throw new Error(`The site has no command named ${name}.`);
	}

	return command.command;
};

/**
 * The first run, in the order the docs' own "Your first run" gives it: install the CLI, check the
 * machine, then set up a project. The commands are the CLI's real ones.
 */
export const GETTING_STARTED_STEPS: readonly Step[] = [
	{
		title: 'Install the CLI',
		command: INSTALL_COMMAND,
		copyLabel: 'Copy the install command',
		href: docsHref('install')
	},
	{
		title: 'Check the machine',
		command: commandFor('doctor'),
		copyLabel: 'Copy the doctor command',
		href: docsHref('doctor')
	},
	{
		title: 'Set up a project',
		command: commandFor('init'),
		copyLabel: 'Copy the init command',
		href: docsHref('init')
	}
];

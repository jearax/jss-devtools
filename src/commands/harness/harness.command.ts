import { styleText } from 'node:util';

import { COMMON_OPTIONS } from '@/core/constants/common-option.constant';
import { helpTitle } from '@/core/ui/terminal.ui';

import { runHarnessUpdate } from './update.command';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['jss-devtools harness update', 'Bring the harness to the installed CLI version'],
	['jss-devtools harness update --dry-run', 'Show what would change, write nothing'],
	['jss-devtools harness update -y', 'Apply without asking (CI)'],
	['jss-devtools harness update --continue', 'Apply the staged conflict resolution'],
	['jss-devtools harness update --abort', 'Discard the staged update']
];

const examplesText = (): string => {
	const width = Math.max(
		...EXAMPLE_ROWS.map(([command]) => {
			return command.length;
		})
	);

	return [
		'',
		helpTitle('Examples:'),
		...EXAMPLE_ROWS.map(([command, description]) => {
			const gap = ' '.repeat(width - command.length + 1);

			return `  ${styleText('dim', '$ ')}${styleText('cyan', command)}${gap}${description}`;
		})
	].join('\n');
};

const registerUpdate = (harness: Command): void => {
	harness
		.command('update')
		.description('Bring the harness to the installed CLI version, keeping your edits')
		.option(
			'--continue',
			'Apply the staged resolution in .harness/update/ after you resolved the conflicts (default: off)'
		)
		.option('--abort', 'Discard the staged update; live files were never changed (default: off)')
		.option(COMMON_OPTIONS.yes.flags, COMMON_OPTIONS.yes.description)
		.option(COMMON_OPTIONS.dryRun.flags, COMMON_OPTIONS.dryRun.description)
		.addHelpText('after', examplesText)
		.action(runHarnessUpdate);
};

export const registerHarnessCommand = (program: Command): void => {
	const harness = program.command('harness').description('Manage the repository harness');

	harness.action(() => {
		harness.help();
	});

	registerUpdate(harness);
};

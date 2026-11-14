import { COMMON_OPTIONS } from '@/core/constants/common-option.constant';
import { examplesText } from '@/core/ui/help-examples.ui';

import { runHarnessDoctor } from './doctor.command';
import { runHarnessUpdate } from './update.command';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['jss-devtools harness update', 'Bring the harness to the installed CLI version'],
	['jss-devtools harness update --dry-run', 'Show what would change, write nothing'],
	['jss-devtools harness update -y', 'Apply without asking (CI)'],
	['jss-devtools harness update --continue', 'Apply the staged conflict resolution'],
	['jss-devtools harness update --abort', 'Discard the staged update']
];

const DOCTOR_CHECKS = `Checks the harness installed in this repository: the manifest in .harness/core/,
the harness block in CLAUDE.md, the harness hook entries in .claude/settings.json, the hook files
under .harness/bin compared with the copies inside the running CLI, config.json, memory limits,
index drift, decision records, symlinks under the harness paths, secrets and private data in the
files git would publish, learned skills, managed-file drift, staged
updates, the installed harness version against the running CLI, and (with AgentKit) uncommitted
ak skill edits.

Exit codes: 0 when the harness is healthy or has warnings only, 1 when any check fails.`;

const registerDoctor = (harness: Command): void => {
	harness
		.command('doctor')
		.description('Check the harness installed in this repository')
		.addHelpText('after', DOCTOR_CHECKS)
		.action(runHarnessDoctor);
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
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(runHarnessUpdate);
};

export const registerHarnessCommand = (program: Command): void => {
	const harness = program.command('harness').description('Manage the repository harness');

	harness.action(() => {
		harness.help();
	});

	registerDoctor(harness);
	registerUpdate(harness);
};

import { basename } from 'node:path';
import { styleText } from 'node:util';

import { confirm, intro, isCancel, log, outro } from '@clack/prompts';

import { PACKAGE } from '@/core/constants/package.constant';
import { CliError } from '@/core/errors/cli.error';
import { isInteractive, nextStepBlock } from '@/core/ui/terminal.ui';
import {
	clearUpdateSession,
	loadResolutions,
	loadUpdateSession,
	withUpdateLock
} from '@/modules/harness/services/staging.service';
import { applyUpdatePlan } from '@/modules/harness/services/update-apply.service';
import { planHarnessUpdate } from '@/modules/harness/services/update-plan.service';
import { runUpdatePreflight } from '@/modules/harness/services/update-preflight.service';
import { harnessRelease } from '@/modules/harness/services/update-release.service';
import { stageConflictedUpdate } from '@/modules/harness/services/update-stage.service';

import { renderHeading, renderUpdatePlan, updateActionCounts, conflictMessage } from './services/update-render.service';

import type { UpdateOptions } from './types/update-options.type';
import type { UpdateMode } from '@/modules/harness/services/update-preflight.service';
import type { UpdatePlan } from '@/modules/harness/types/update.type';
import type { Command } from 'commander';

const typedWordsOf = (command: Command): readonly string[] => {
	const rawArgs = (command.parent as { rawArgs?: readonly string[] } | undefined)?.rawArgs ?? [];
	const subIndex = rawArgs.indexOf(command.name());

	return rawArgs.slice(subIndex).filter((word) => {
		return word !== '--dry-run';
	});
};

const applyCommandLineOf = (command: Command): string => {
	return [PACKAGE.name, ...typedWordsOf(command)].map(shellQuote).join(' ');
};

const shellQuote = (word: string): string => {
	return /[^A-Za-z0-9_@%+=:,./-]/.test(word) ? `'${word.replace(/'/g, `'\\''`)}'` : word;
};

const runAbort = (cwd: string): void => {
	if (loadUpdateSession(cwd) === null) {
		throw new CliError('No staged harness update to abort');
	}

	clearUpdateSession(cwd);

	outro('Staged update discarded; live files were never changed');
};

const confirmWrite = async (cwd: string, plan: UpdatePlan, options: UpdateOptions): Promise<void> => {
	if (options.yes !== true && !isInteractive()) {
		throw new CliError('Not a terminal', {
			hint: 'Run it in a terminal, or pass --yes'
		});
	}

	if (options.yes !== true) {
		const counts = updateActionCounts(plan);
		const writes = (counts['create'] ?? 0) + (counts['update'] ?? 0);
		const deletes = counts['delete'] ?? 0;
		const noun = writes === 1 ? 'file' : 'files';

		const confirmed = await confirm({
			message:
				deletes === 0
					? `Write ${writes} ${noun} to ${basename(cwd)} and finish the update?`
					: `Write ${writes} ${noun}; delete ${deletes} in ${basename(cwd)} and finish the update?`,
			initialValue: true
		});

		if (isCancel(confirmed) || confirmed !== true) {
			throw new CliError('Cancelled, nothing written');
		}
	}
};

export const runHarnessUpdate = async (options: UpdateOptions, command: Command): Promise<void> => {
	const cwd = process.cwd();

	intro(styleText('inverse', ` ${PACKAGE.name} harness update `));

	if (options.abort === true) {
		runAbort(cwd);

		return;
	}

	const mode: UpdateMode = options.continue === true ? 'continue' : 'update';
	const release = harnessRelease();

	if (mode === 'continue') {
		const session = loadUpdateSession(cwd);
		const preflight = await runUpdatePreflight(cwd, release.version, 'continue');

		if (session === null || preflight.status !== 'ok') {
			throw new CliError('No staged harness update to continue');
		}

		if (session.to !== release.version) {
			throw new CliError('The staged update targets another CLI version', {
				hint: 'Run jss-devtools harness update --abort, then update again'
			});
		}

		await withUpdateLock(cwd, async () => {
			const overrides = loadResolutions(cwd, session);

			const plan = await planHarnessUpdate(cwd, release, overrides);

			const remaining = plan.conflicts.filter((conflict) => {
				return !overrides.has(conflict.path);
			});

			if (remaining.length > 0) {
				throw new CliError('The resolved copies did not cover every conflict; run jss-devtools harness update again');
			}

			log.step(renderHeading(plan, basename(cwd)));

			log.message(renderUpdatePlan(plan), { spacing: 0 });

			if (options.dryRun === true) {
				outro(['Dry run: nothing written', ...nextStepBlock('To apply', [applyCommandLineOf(command)])].join('\n'));

				return;
			}

			await confirmWrite(cwd, plan, options);

			applyUpdatePlan(cwd, plan.actions, release);

			clearUpdateSession(cwd);

			outro('Staged update applied');
		});

		return;
	}

	const preflight = await runUpdatePreflight(cwd, release.version, 'update');

	if (preflight.status === 'up-to-date') {
		outro('Harness is up to date');

		return;
	}

	await withUpdateLock(cwd, async () => {
		const plan = await planHarnessUpdate(cwd, release);

		if (plan.actions.length === 0) {
			outro('Harness is up to date');

			return;
		}

		log.step(renderHeading(plan, basename(cwd)));

		log.message(renderUpdatePlan(plan), { spacing: 0 });

		if (options.dryRun === true) {
			outro(['Dry run: nothing written', ...nextStepBlock('To apply', [applyCommandLineOf(command)])].join('\n'));

			return;
		}

		if (plan.conflicts.length > 0) {
			stageConflictedUpdate(cwd, preflight.manifest.version, plan, release);

			throw new CliError(conflictMessage(plan), {
				label: 'To finish',
				commands: ['jss-devtools harness update --continue', 'jss-devtools harness update --abort']
			});
		}

		await confirmWrite(cwd, plan, options);

		applyUpdatePlan(cwd, plan.actions, release);

		outro('Harness updated');
	});
};

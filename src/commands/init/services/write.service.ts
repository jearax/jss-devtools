import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { gitInit } from '@/core/adapters/git.adapter';
import { CliError } from '@/core/errors/cli.error';
import { shellQuote } from '@/core/utils/shell-quote.util';

import type { InitPlan, PlanEntry } from '@/commands/init/types/init-plan.type';

const WRITTEN_LIST_LIMIT = 5;

const writtenSummary = (written: readonly string[]): string => {
	const list = written.length <= WRITTEN_LIST_LIMIT ? `: ${written.join(', ')}` : '';

	return `Wrote ${written.length} ${written.length === 1 ? 'file' : 'files'} before it${list}`;
};

const failedWriteError = (
	verb: 'write' | 'delete',
	path: string,
	written: readonly string[],
	error: unknown
): CliError => {
	const cause = error instanceof Error ? error.message : String(error);

	return new CliError(`Could not ${verb} ${path}: ${cause}\n${writtenSummary(written)}`, {
		hint: 'Fix the permission, then rerun; unchanged files are skipped'
	});
};

const writeEntry = (targetDir: string, entry: PlanEntry): void => {
	if (entry.content === undefined) {
		return;
	}

	mkdirSync(dirname(join(targetDir, entry.path)), { recursive: true });
	writeFileSync(join(targetDir, entry.path), entry.content);
};

export const applyInitPlan = async (plan: InitPlan): Promise<void> => {
	if (plan.mode === 'create') {
		mkdirSync(plan.targetDir, { recursive: true });

		if (!(await gitInit(plan.targetDir))) {
			const dir = basename(plan.targetDir);

			throw new CliError(`Could not run git init in ${dir}`, {
				label: 'To see why',
				commands: [`cd ${shellQuote(dir)}`, 'git init']
			});
		}
	}

	const written: string[] = [];

	for (const entry of plan.entries) {
		if (entry.action !== 'delete') {
			try {
				writeEntry(plan.targetDir, entry);
			} catch (error) {
				throw failedWriteError('write', entry.path, written, error);
			}

			written.push(entry.path);
		}
	}

	for (const entry of plan.entries) {
		if (entry.action === 'delete') {
			try {
				rmSync(join(plan.targetDir, entry.path));
			} catch (error) {
				throw failedWriteError('delete', entry.path, written, error);
			}
		}
	}
};

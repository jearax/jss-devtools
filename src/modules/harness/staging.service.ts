import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CliError } from '@/core/errors/cli.error';

import { extractBlockUnit, hasConflictMarkers } from './block-region.service';
import { HARNESS_UPDATE_DIR, HARNESS_UPDATE_LOCK, HARNESS_UPDATE_SESSION } from './constants/harness-paths.constant';

import type { HarnessRecordedKind, UpdateSession } from './types/update.type';

export const updateDirOf = (cwd: string): string => {
	return join(cwd, HARNESS_UPDATE_DIR);
};

export const loadUpdateSession = (cwd: string): UpdateSession | null => {
	const path = join(cwd, HARNESS_UPDATE_SESSION);

	if (!existsSync(path)) {
		return null;
	}

	return JSON.parse(readFileSync(path, 'utf8')) as UpdateSession;
};

export const clearUpdateSession = (cwd: string): void => {
	rmSync(updateDirOf(cwd), {
		recursive: true,
		force: true
	});
};

// The lock is advisory and per machine; a crashed run leaves it, and deleting it is the way back.
export const withUpdateLock = async <T>(cwd: string, run: () => Promise<T>): Promise<T> => {
	mkdirSync(updateDirOf(cwd), {
		recursive: true
	});

	let lock: number;

	try {
		lock = openSync(join(cwd, HARNESS_UPDATE_LOCK), 'wx');
	} catch {
		throw new CliError('Another harness update appears to be running', {
			hint: `If none is, delete ${HARNESS_UPDATE_LOCK} and rerun`
		});
	}

	try {
		return await run();
	} finally {
		closeSync(lock);
		// staging may have removed the whole update folder, lock included
		rmSync(join(cwd, HARNESS_UPDATE_LOCK), {
			force: true
		});

		const root = updateDirOf(cwd);

		if (existsSync(root) && readdirSync(root).length === 0) {
			rmSync(root, {
				recursive: true,
				force: true
			});
		}
	}
};

type StagedInput = {
	path: string;
	kind: HarnessRecordedKind;
	base: string | null;
	local: string | null;
	upstream: string | null;
	resolved: string | null;
};

export const stageConflicts = (cwd: string, session: UpdateSession, inputs: readonly StagedInput[]): void => {
	const root = updateDirOf(cwd);

	rmSync(root, {
		recursive: true,
		force: true
	});

	mkdirSync(root, {
		recursive: true
	});

	for (const input of inputs) {
		for (const [folder, content] of [
			['base', input.base],
			['local', input.local],
			['upstream', input.upstream],
			['resolved', input.resolved]
		] as const) {
			if (content === null) {
				continue;
			}

			const target = join(root, folder, input.path);

			mkdirSync(dirname(target), {
				recursive: true
			});

			writeFileSync(target, content);
		}
	}

	writeFileSync(join(cwd, HARNESS_UPDATE_SESSION), `${JSON.stringify(session, null, '\t')}\n`);
};

// Refuses while a resolved copy still holds conflict or block markers; block paths stage and
// resolve the text between the markers, so their resolved copy must not carry the markers.
export const loadResolutions = (cwd: string, session: UpdateSession): Map<string, string> => {
	const root = updateDirOf(cwd);
	const overrides = new Map<string, string>();

	for (const conflict of session.conflicts) {
		const path = join(root, 'resolved', conflict.path);

		if (!existsSync(path)) {
			throw new CliError(`No resolved copy at ${HARNESS_UPDATE_DIR}/resolved/${conflict.path}`, {
				hint: 'Restore it from the local or upstream copy next to it, then rerun'
			});
		}

		const content = readFileSync(path, 'utf8');

		if (hasConflictMarkers(content)) {
			throw new CliError(`${HARNESS_UPDATE_DIR}/resolved/${conflict.path} still holds conflict markers`);
		}

		if (conflict.kind === 'block' && content.includes('HARNESS:BEGIN')) {
			throw new CliError(
				`${HARNESS_UPDATE_DIR}/resolved/${conflict.path} must hold only the text between the harness block markers, not the markers`
			);
		}

		if (conflict.kind === 'config') {
			try {
				JSON.parse(content);
			} catch (error) {
				throw new CliError(
					`${HARNESS_UPDATE_DIR}/resolved/${conflict.path} is not valid JSON: ${(error as Error).message}`
				);
			}
		}

		overrides.set(conflict.path, content);
	}

	return overrides;
};

// Block conflicts stage and resolve the text between the markers; everything else stages whole files.
export const stagedInputsOf = (
	conflicts: ReadonlyArray<{ path: string; kind: HarnessRecordedKind; reason: string }>,
	readers: {
		base: (path: string) => string | null;
		local: (path: string) => string | null;
		upstream: (path: string) => string | null;
		proposal: (path: string) => string | null;
	}
): StagedInput[] => {
	const toSpace = (kind: HarnessRecordedKind, text: string | null): string | null => {
		return kind === 'block' && text !== null ? extractBlockUnit(text) : text;
	};

	return conflicts.map((conflict) => {
		const resolved = toSpace(conflict.kind, readers.proposal(conflict.path));

		return {
			path: conflict.path,
			kind: conflict.kind,
			base: toSpace(conflict.kind, readers.base(conflict.path)),
			local: toSpace(conflict.kind, readers.local(conflict.path)),
			upstream: toSpace(conflict.kind, readers.upstream(conflict.path)),
			resolved
		};
	});
};

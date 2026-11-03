import { createHash } from 'node:crypto';

import { gitWorktreeChanges } from '@/core/adapters/git.adapter';

import { logHookError } from './hook-errors.service';

export type Fingerprint = {
	hash: string | null;
	failed: boolean;
};

export const worktreeFingerprint = async (root: string): Promise<Fingerprint> => {
	const changes = await gitWorktreeChanges(root);

	if (changes.kind === 'missing') {
		return {
			hash: null,
			failed: false
		};
	}

	if (changes.kind === 'failed') {
		logHookError(root, `the worktree fingerprint failed: ${changes.problem}`);

		return {
			hash: null,
			failed: true
		};
	}

	return {
		hash: createHash('sha256').update(changes.status).update(changes.diff).digest('hex'),
		failed: false
	};
};

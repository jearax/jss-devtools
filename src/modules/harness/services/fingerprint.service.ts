import { createHash } from 'node:crypto';

import { gitWorktreeChanges } from '@/core/adapters/git.adapter';

export const worktreeFingerprint = async (root: string): Promise<string | null> => {
	const changes = await gitWorktreeChanges(root);

	if (changes === null) {
		return null;
	}

	return createHash('sha256').update(changes.status).update(changes.diff).digest('hex');
};

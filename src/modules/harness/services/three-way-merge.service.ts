import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { gitMergeFile } from '@/core/adapters/git.adapter';
import { CliError } from '@/core/errors/cli.error';

export type ThreeWayMergeResult = {
	content: string;
	conflicted: boolean;
};

// git merge-file exits with the number of conflicting hunks (capped at 127), negative on error.
export const mergeThreeWay = async (local: string, base: string, upstream: string): Promise<ThreeWayMergeResult> => {
	if (local === base) {
		return {
			content: upstream,
			conflicted: false
		};
	}

	if (upstream === base || local === upstream) {
		return {
			content: local,
			conflicted: false
		};
	}

	const dir = mkdtempSync(join(tmpdir(), 'jss-merge-'));

	try {
		const paths = {
			local: join(dir, 'local'),
			base: join(dir, 'base'),
			upstream: join(dir, 'upstream')
		};

		writeFileSync(paths.local, local);
		writeFileSync(paths.base, base);
		writeFileSync(paths.upstream, upstream);

		const result = await gitMergeFile(paths.local, paths.base, paths.upstream);

		if (result.code === null || result.code < 0 || result.code > 127) {
			throw new CliError(`git merge-file failed: ${result.stderr.trim() || 'the command reported no exit code'}`);
		}

		return {
			content: result.stdout,
			conflicted: result.code > 0
		};
	} finally {
		rmSync(dir, {
			recursive: true,
			force: true
		});
	}
};

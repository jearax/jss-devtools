import { describe, expect, it } from 'vitest';

import { resolveInitMode, validateInitArguments } from '@/commands/init/services/init.service';

import { snapshotDir } from './support/fs-snapshot';
import { makeEmptyDir, removeDir } from './support/tmp-dir';

const messageOf = (run: () => void): string => {
	try {
		run();
	} catch (error) {
		return (error as Error).message;
	}

	throw new Error('expected the arguments to be rejected');
};

const expectsUnchangedDir = (dir: string, before: string): void => {
	expect(snapshotDir(dir)).toBe(before);
};

describe('init argument rules', () => {
	it('exits 1 for a framework other than node or nest, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { framework: 'react' });
			})
		).toBe('Framework react is not supported yet');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('accepts --framework nest with <dir>', () => {
		expect(() => {
			validateInitArguments(['my-api'], { framework: 'nest' });
		}).not.toThrow();
	});

	it('exits 1 for --framework nest without <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { framework: 'nest' });
			})
		).toBe('Framework nest needs <dir>');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('exits 1 for --pm without <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { pm: 'pnpm' });
			})
		).toBe('Option --pm needs <dir>');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('exits 1 for --monorepo without <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { monorepo: true });
			})
		).toBe('Option --monorepo needs <dir>');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('exits 1 for -f with <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], { force: true });
			})
		).toBe('Option --force is for an existing project');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('exits 1 for --agent-kit with --no-harness', () => {
		expect(
			messageOf(() => {
				validateInitArguments([], {
					agentKit: true,
					harness: false
				});
			})
		).toBe('Option --agent-kit needs the harness');
	});

	it('rejects --share-knowledge with --no-harness', () => {
		expect(() => {
			return validateInitArguments([], {
				shareKnowledge: true,
				harness: false
			});
		}).toThrow('Option --share-knowledge needs the harness');
		expect(
			(() => {
				validateInitArguments([], { shareKnowledge: true });

				return 'accepted';
			})()
		).toBe('accepted');
	});

	it('exits 1 for --no-sample without --framework nest', () => {
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], {
					framework: 'node',
					sample: false
				});
			})
		).toBe('--no-sample needs --framework nest');
		expect(
			messageOf(() => {
				validateInitArguments(['my-api'], { sample: false });
			})
		).toBe('--no-sample needs --framework nest');
	});

	it('accepts --no-sample with --framework nest', () => {
		expect(() => {
			validateInitArguments(['my-api'], {
				framework: 'nest',
				sample: false
			});
		}).not.toThrow();
	});

	it('picks create mode with <dir> and existing mode without', () => {
		expect(resolveInitMode(['my-app'])).toBe('create');
		expect(resolveInitMode([])).toBe('existing');
	});
});

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
	it('exits 1 for a framework other than node, nest or react, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { framework: ['rn'] });
			})
		).toBe('Framework rn is not supported yet');
		expect(
			messageOf(() => {
				validateInitArguments([], { framework: ['next'] });
			})
		).toBe('Framework next is not supported yet');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('accepts --framework react with <dir>', () => {
		expect(() => {
			validateInitArguments(['my-web'], { framework: ['react'] });
		}).not.toThrow();
	});

	it('exits 1 for --framework react without <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { framework: ['react'] });
			})
		).toBe('Framework react needs <dir>');
		expectsUnchangedDir(dir, before);

		await removeDir(dir);
	});

	it('accepts --framework nest with <dir>', () => {
		expect(() => {
			validateInitArguments(['my-api'], { framework: ['nest'] });
		}).not.toThrow();
	});

	it('exits 1 for --framework nest without <dir>, and the folder is unchanged', async () => {
		const dir = await makeEmptyDir();
		const before = snapshotDir(dir);

		expect(
			messageOf(() => {
				validateInitArguments([], { framework: ['nest'] });
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

	it('exits 1 for --no-sample without --framework nest', () => {
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], {
					framework: ['node'],
					sample: false
				});
			})
		).toBe('--no-sample needs --framework nest');
		expect(
			messageOf(() => {
				validateInitArguments(['my-web'], {
					framework: ['react'],
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
				framework: ['nest'],
				sample: false
			});
		}).not.toThrow();
	});

	it('accepts several frameworks with --monorepo, --no-sample included when nest is one of them', () => {
		expect(() => {
			validateInitArguments(['my-app'], {
				monorepo: true,
				framework: ['nest', 'react', 'node'],
				sample: false
			});
		}).not.toThrow();
	});

	it('exits 1 for several frameworks without --monorepo', () => {
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], { framework: ['nest', 'react'] });
			})
		).toBe('Several frameworks need --monorepo');
	});

	it('exits 1 for a framework listed twice, with or without --monorepo', () => {
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], {
					monorepo: true,
					framework: ['nest', 'react', 'nest']
				});
			})
		).toBe('Framework nest is listed twice');
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], { framework: ['react', 'react'] });
			})
		).toBe('Framework react is listed twice');
	});

	it('exits 1 for an unsupported framework anywhere in the list', () => {
		expect(
			messageOf(() => {
				validateInitArguments(['my-app'], {
					monorepo: true,
					framework: ['nest', 'next']
				});
			})
		).toBe('Framework next is not supported yet');
	});

	it('picks create mode with <dir> and existing mode without', () => {
		expect(resolveInitMode(['my-app'])).toBe('create');
		expect(resolveInitMode([])).toBe('existing');
	});
});

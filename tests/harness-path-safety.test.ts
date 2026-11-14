import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { isSafePath, pathSafetyOf, safeReadFile } from '@/modules/harness/services/path-safety.service';

import { makeEmptyDir } from './support/tmp-dir';

describe('pathSafetyOf', () => {
	it('accepts a plain file, a missing path and a root reached through a symlink', async () => {
		const dir = await makeEmptyDir();
		const linkDir = await makeEmptyDir();
		const throughLink = join(linkDir, 'repo');

		symlinkSync(dir, throughLink);

		writeFileSync(join(throughLink, 'file.txt'), 'text\n');
		mkdirSync(join(dir, 'nested'));

		expect(isSafePath(throughLink, 'file.txt')).toBe(true);
		expect(isSafePath(dir, 'nested/missing.txt')).toBe(true);
		expect(pathSafetyOf(dir, 'nested').reason).toBeNull();
	});

	it('refuses a symlinked file and a file under a symlinked folder, naming the path', async () => {
		const dir = await makeEmptyDir();
		const outside = await makeEmptyDir();

		writeFileSync(join(outside, 'outside.md'), 'secret from outside\n');
		writeFileSync(join(dir, 'plain.txt'), 'plain\n');
		mkdirSync(join(dir, '.harness'));

		symlinkSync(join(outside, 'outside.md'), join(dir, '.harness/MEMORY.md'));
		symlinkSync(outside, join(dir, 'linked'));

		const fileSafety = pathSafetyOf(dir, '.harness/MEMORY.md');

		expect(fileSafety.safe).toBe(false);
		expect(fileSafety.reason).toBe('is a symlink');

		const folderSafety = pathSafetyOf(dir, 'linked/file.txt');

		expect(folderSafety.safe).toBe(false);
		expect(folderSafety.reason).toBe('is a symlink');

		expect(safeReadFile(dir, '.harness/MEMORY.md')).toBeNull();
	});

	it('refuses a ".." segment and an absolute path', async () => {
		const dir = await makeEmptyDir();

		expect(pathSafetyOf(dir, '../outside.txt').reason).toBe('contains a ".." segment');
		expect(pathSafetyOf(dir, '/etc/hosts').reason).toBe('is an absolute path');
	});
});

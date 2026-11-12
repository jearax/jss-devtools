import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

export const CLI = resolve(import.meta.dirname, '../../dist/cli.mjs');

export const run = promisify(execFile);

export const available = async (pm: string): Promise<boolean> => {
	try {
		await run(pm, ['--version']);

		return true;
	} catch {
		return false;
	}
};

export const TIMEOUT = 10 * 60 * 1000;

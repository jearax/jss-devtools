import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_ERROR_CURSOR, HARNESS_ERROR_LOG, HARNESS_STATE_DIR } from './constants/harness-paths.constant';

export const logHookError = (root: string, detail: string): void => {
	try {
		const dir = join(root, HARNESS_STATE_DIR);

		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(root, HARNESS_ERROR_LOG),
			`${new Date().toISOString()} ${detail.replace(/\s+/g, ' ').slice(0, 400)}\n`,
			{ flag: 'a' }
		);
	} catch {
		return;
	}
};

export const hookErrorsSinceLastSession = (root: string): string[] => {
	const logPath = join(root, HARNESS_ERROR_LOG);

	if (!existsSync(logPath)) {
		return [];
	}

	const cursorPath = join(root, HARNESS_ERROR_CURSOR);
	const text = readFileSync(logPath, 'utf8');
	const offset = existsSync(cursorPath) ? Number(readFileSync(cursorPath, 'utf8').trim() || '0') : 0;
	const fresh = text.slice(offset > 0 && offset <= text.length ? offset : 0);

	const lines = fresh.split('\n').filter((line) => {
		return line !== '';
	});

	mkdirSync(join(root, HARNESS_STATE_DIR), { recursive: true });
	writeFileSync(cursorPath, String(text.length));

	return lines;
};

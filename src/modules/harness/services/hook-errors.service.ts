import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { HOOK_ERROR_LOG_MAX_BYTES } from '@/modules/harness/constants/harness-limits.constant';
import {
	HARNESS_ERROR_CURSOR,
	HARNESS_ERROR_LOG,
	HARNESS_STATE_DIR
} from '@/modules/harness/constants/harness-paths.constant';

import { isSafePath } from './path-safety.service';
import { redactLine } from './redaction.service';

const NEWLINE = 0x0a;

const trimToNewestHalf = (path: string): number => {
	const buffer = readFileSync(path);
	const start = buffer.length - Math.floor(buffer.length / 2);
	const newline = buffer.indexOf(NEWLINE, start);
	const kept = buffer.subarray(newline === -1 ? buffer.length : newline + 1);

	writeFileSync(path, kept);

	return buffer.length - kept.length;
};

// The cursor is a byte offset; trimming the front of the log moves everything behind it.
const shiftCursor = (root: string, removed: number): void => {
	const cursorPath = join(root, HARNESS_ERROR_CURSOR);

	if (!existsSync(cursorPath) || !isSafePath(root, HARNESS_ERROR_CURSOR)) {
		return;
	}

	const cursor = Number(readFileSync(cursorPath, 'utf8').trim() || '0');

	writeFileSync(cursorPath, String(Math.max(0, cursor - removed)));
};

export const logHookError = (root: string, detail: string): void => {
	try {
		if (!isSafePath(root, HARNESS_ERROR_LOG)) {
			return;
		}

		const dir = join(root, HARNESS_STATE_DIR);

		mkdirSync(dir, { recursive: true });

		const path = join(root, HARNESS_ERROR_LOG);
		const line = `${new Date().toISOString()} ${redactLine(detail.replace(/\s+/g, ' ').slice(0, 400))}\n`;

		if (existsSync(path) && statSync(path).size + Buffer.byteLength(line) > HOOK_ERROR_LOG_MAX_BYTES) {
			shiftCursor(root, trimToNewestHalf(path));
		}

		writeFileSync(path, line, { flag: 'a' });
	} catch {
		return;
	}
};

export const hookErrorsSinceLastSession = (root: string): string[] => {
	const logPath = join(root, HARNESS_ERROR_LOG);

	if (!existsSync(logPath) || !isSafePath(root, HARNESS_ERROR_LOG)) {
		return [];
	}

	const cursorPath = join(root, HARNESS_ERROR_CURSOR);
	const buffer = readFileSync(logPath);

	const offset =
		existsSync(cursorPath) && isSafePath(root, HARNESS_ERROR_CURSOR)
			? Number(readFileSync(cursorPath, 'utf8').trim() || '0')
			: 0;

	const fresh = buffer.subarray(offset > 0 && offset <= buffer.length ? offset : 0).toString('utf8');

	const lines = fresh.split('\n').filter((line) => {
		return line !== '';
	});

	if (!isSafePath(root, HARNESS_ERROR_CURSOR)) {
		return lines;
	}

	mkdirSync(join(root, HARNESS_STATE_DIR), { recursive: true });
	writeFileSync(cursorPath, String(buffer.length));

	return lines;
};

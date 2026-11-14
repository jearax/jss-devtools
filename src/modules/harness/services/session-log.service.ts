import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DAY_MS, SESSION_TTL_DAYS } from '@/modules/harness/constants/harness-limits.constant';
import { HARNESS_SESSIONS_DIR } from '@/modules/harness/constants/harness-paths.constant';

import { isSafePath, safeReadFile } from './path-safety.service';

import type { SessionEvent } from '@/modules/harness/types/hook.type';

const sessionIdOf = (raw: string): string => {
	return raw.replace(/[^A-Za-z0-9_-]/g, '_') || 'unknown';
};

const logPath = (root: string, sessionId: string): string => {
	return join(root, HARNESS_SESSIONS_DIR, `${sessionIdOf(sessionId)}.jsonl`);
};

export const appendSessionEvent = (root: string, sessionId: string, event: SessionEvent): void => {
	const relative = `${HARNESS_SESSIONS_DIR}/${sessionIdOf(sessionId)}.jsonl`;

	if (!isSafePath(root, relative)) {
		return;
	}

	const path = logPath(root, sessionId);

	mkdirSync(join(root, HARNESS_SESSIONS_DIR), { recursive: true });
	writeFileSync(path, `${JSON.stringify(event)}\n`, { flag: 'a' });
};

export const readSessionLog = (root: string, sessionId: string): SessionEvent[] => {
	const text = safeReadFile(root, `${HARNESS_SESSIONS_DIR}/${sessionIdOf(sessionId)}.jsonl`);

	if (text === null) {
		return [];
	}

	return text
		.split('\n')
		.filter((line) => {
			return line !== '';
		})
		.flatMap((line) => {
			try {
				return [JSON.parse(line) as SessionEvent];
			} catch {
				return [];
			}
		});
};

export const pruneSessions = (root: string, now: number = Date.now()): void => {
	const dir = join(root, HARNESS_SESSIONS_DIR);

	if (!existsSync(dir)) {
		return;
	}

	const cutoff = now - SESSION_TTL_DAYS * DAY_MS;

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isFile()) {
			continue;
		}

		const full = join(dir, entry.name);

		if (statSync(full).mtimeMs < cutoff) {
			unlinkSync(full);
		}
	}
};

export const touchSession = (root: string, sessionId: string, at: number = Date.now()): void => {
	const path = logPath(root, sessionId);

	if (existsSync(path)) {
		utimesSync(path, at, at);
	}
};

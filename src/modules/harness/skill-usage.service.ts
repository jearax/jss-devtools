import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DAY_MS } from './constants/harness-limits.constant';
import { HARNESS_CURATOR, HARNESS_SKILL_USAGE } from './constants/harness-paths.constant';

export type SkillUsageMap = Record<string, string>;

const writeJson = (path: string, data: unknown): void => {
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(path, `${JSON.stringify(data, null, '\t')}\n`);
};

export const foldSkillUsage = (root: string, names: readonly string[], today: string): SkillUsageMap => {
	const path = join(root, HARNESS_SKILL_USAGE);

	if (names.length === 0) {
		return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as SkillUsageMap) : {};
	}

	const usage = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as SkillUsageMap) : {};
	const merged: SkillUsageMap = { ...usage };

	for (const name of names) {
		const current = merged[name];

		merged[name] = current === undefined || current < today ? today : current;
	}

	writeJson(path, merged);

	return merged;
};

export const lastCuratorRun = (root: string): string | null => {
	const path = join(root, HARNESS_CURATOR);

	if (!existsSync(path)) {
		return null;
	}

	try {
		const parsed = JSON.parse(readFileSync(path, 'utf8')) as { lastRun?: unknown };

		return typeof parsed.lastRun === 'string' ? parsed.lastRun : null;
	} catch {
		return null;
	}
};

export const recordCuratorRun = (root: string, day: string): void => {
	writeJson(join(root, HARNESS_CURATOR), { lastRun: day });
};

export const dayDiff = (from: string, to: string): number | null => {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);

	return Number.isNaN(start) || Number.isNaN(end) ? null : Math.floor((end - start) / DAY_MS);
};

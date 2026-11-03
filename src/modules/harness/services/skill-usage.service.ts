import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DAY_MS } from '@/modules/harness/constants/harness-limits.constant';
import { HARNESS_CURATOR, HARNESS_SKILL_USAGE } from '@/modules/harness/constants/harness-paths.constant';

import { logHookError } from './hook-errors.service';

export type SkillUsageMap = Record<string, string>;

const writeJson = (path: string, data: unknown): void => {
	mkdirSync(join(path, '..'), { recursive: true });

	const temp = `${path}.${process.pid}.tmp`;

	try {
		writeFileSync(temp, `${JSON.stringify(data, null, '\t')}\n`);
		renameSync(temp, path);
	} catch (error) {
		rmSync(temp, {
			force: true
		});

		throw error;
	}
};

const readJson = <T>(root: string, path: string, label: string, fallback: T): { value: T; corrupt: boolean } => {
	if (!existsSync(path)) {
		return {
			value: fallback,
			corrupt: false
		};
	}

	try {
		return {
			value: JSON.parse(readFileSync(path, 'utf8')) as T,
			corrupt: false
		};
	} catch (error) {
		logHookError(root, `${label} is not valid JSON: ${(error as Error).message}`);

		return {
			value: fallback,
			corrupt: true
		};
	}
};

export const foldSkillUsage = (root: string, names: readonly string[], today: string): SkillUsageMap => {
	const path = join(root, HARNESS_SKILL_USAGE);
	const { value: usage, corrupt } = readJson<SkillUsageMap>(root, path, HARNESS_SKILL_USAGE, {});

	if (names.length === 0 && !corrupt) {
		return usage;
	}

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

	const { value } = readJson<{ lastRun?: unknown }>(root, path, HARNESS_CURATOR, {});

	return typeof value.lastRun === 'string' ? value.lastRun : null;
};

export const recordCuratorRun = (root: string, day: string): void => {
	writeJson(join(root, HARNESS_CURATOR), { lastRun: day });
};

export const dayDiff = (from: string, to: string): number | null => {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);

	return Number.isNaN(start) || Number.isNaN(end) ? null : Math.floor((end - start) / DAY_MS);
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_CONFIG } from './constants/harness-paths.constant';

import type { HarnessConfig } from './types/hook.type';

const EMPTY_CONFIG: HarnessConfig = {
	review: {},
	memory: {},
	curator: {}
};

const REPAIR_HINT = 'run "jss-devtools harness update" to restore the default keys';

const NUMBER_KEYS = [
	['review', 'minToolCalls'],
	['memory', 'maxChars'],
	['memory', 'maxEntryChars'],
	['curator', 'minLearnedSkills'],
	['curator', 'intervalDays'],
	['curator', 'staleDays'],
	['curator', 'archiveDays']
] as const;

const groupOf = (config: unknown, group: string): Record<string, unknown> => {
	const value = (config as Record<string, unknown> | null)?.[group];

	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
};

export const readConfig = (root: string): { config: HarnessConfig; problems: string[] } => {
	const path = join(root, HARNESS_CONFIG);
	const problems: string[] = [];
	let parsed: unknown = null;

	if (existsSync(path)) {
		try {
			parsed = JSON.parse(readFileSync(path, 'utf8'));
		} catch {
			problems.push(`config.json is not valid JSON — ${REPAIR_HINT}`);
			parsed = null;
		}
	} else {
		problems.push(`config.json is missing — ${REPAIR_HINT}`);
	}

	const config: HarnessConfig = { ...EMPTY_CONFIG };

	for (const [group, key] of NUMBER_KEYS) {
		const value = groupOf(parsed, group)[key];

		if (typeof value === 'number' && Number.isFinite(value)) {
			(config[group] as Record<string, number | undefined>)[key] = value;
		} else {
			problems.push(`config.json is missing a usable "${group}.${key}" — ${REPAIR_HINT}`);
		}
	}

	return {
		config,
		problems
	};
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_CONFIG } from '@/modules/harness/constants/harness-paths.constant';
import { HARNESS_CONFIG_DEFAULTS } from '@/modules/harness/templates/harness-config.template';

import type { HarnessConfig } from '@/modules/harness/types/hook.type';

const EMPTY_CONFIG: HarnessConfig = {
	review: {},
	memory: {},
	curator: {}
};

const REPAIR_HINT = 'run "jss-devtools harness update" to restore the default keys';

type ConfigGroup = keyof HarnessConfig;

const NUMBER_KEYS: readonly (readonly [ConfigGroup, string])[] = (
	Object.keys(HARNESS_CONFIG_DEFAULTS) as ConfigGroup[]
).flatMap((group) => {
	return Object.entries(HARNESS_CONFIG_DEFAULTS[group])
		.filter(([, value]) => {
			return typeof value === 'number';
		})
		.map(([key]) => {
			return [group, key] as const;
		});
});

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

import { HARNESS_CONFIG_DEFAULTS } from './templates/harness-config.template';

import type { HarnessConfig } from './types/hook.type';

export type ConfigMergeResult = {
	content: string;
	conflictKeys: readonly string[];
};

type Group = Record<string, unknown>;

const groupOf = (config: HarnessConfig | null, name: string): Group | null => {
	const value = (config as Record<string, unknown> | null)?.[name];

	return typeof value === 'object' && value !== null ? (value as Group) : null;
};

const keyState = (base: Group | null, local: Group | null, key: string): 'missing' | 'same' | 'edited' => {
	const inLocal = local !== null && key in local;
	const inBase = base !== null && key in base;

	if (!inLocal) {
		return 'missing';
	}

	if (!inBase) {
		return 'edited';
	}

	return local[key] === base[key] ? 'same' : 'edited';
};

export const mergeHarnessConfig = (baseRaw: string | null, localRaw: string): ConfigMergeResult => {
	const base = baseRaw === null ? null : (JSON.parse(baseRaw) as HarnessConfig);
	const local = JSON.parse(localRaw) as HarnessConfig;
	const merged = JSON.parse(JSON.stringify(local)) as HarnessConfig;

	const conflictKeys: string[] = [];

	for (const [groupName, defaults] of Object.entries(HARNESS_CONFIG_DEFAULTS)) {
		const baseGroup = groupOf(base, groupName);
		const localGroup = groupOf(local, groupName);

		if (localGroup === null) {
			(merged as Record<string, unknown>)[groupName] = { ...defaults };

			continue;
		}

		const target = (merged as Record<string, unknown>)[groupName] as Group;

		for (const [key, defaultValue] of Object.entries(defaults)) {
			const state = keyState(baseGroup, localGroup, key);

			if (state === 'same' || state === 'missing') {
				target[key] = defaultValue;
			} else if (baseGroup !== null && baseGroup[key] === defaultValue) {
				target[key] = localGroup[key];
			} else if (localGroup[key] === defaultValue) {
				target[key] = defaultValue;
			} else {
				conflictKeys.push(`${groupName}.${key}`);
				target[key] = localGroup[key];
			}
		}
	}

	return {
		content: `${JSON.stringify(merged, null, '\t')}\n`,
		conflictKeys
	};
};

export const missingConfigKeys = (localRaw: string): readonly string[] => {
	const local = JSON.parse(localRaw) as HarnessConfig;
	const missing: string[] = [];

	for (const [groupName, defaults] of Object.entries(HARNESS_CONFIG_DEFAULTS) as ReadonlyArray<
		[groupName: string, defaults: Record<string, unknown>]
	>) {
		const localGroup = groupOf(local, groupName);

		for (const key of Object.keys(defaults)) {
			if (localGroup === null || !(key in localGroup)) {
				missing.push(`${groupName}.${key}`);
			}
		}
	}

	return missing;
};

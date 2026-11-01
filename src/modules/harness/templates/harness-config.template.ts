import type { HarnessConfig } from '@/modules/harness/types/hook.type';

export const HARNESS_CONFIG_DEFAULTS: HarnessConfig = {
	review: { minToolCalls: 8 },
	memory: {
		maxChars: 3000,
		maxEntryChars: 240
	},
	curator: {
		minLearnedSkills: 10,
		intervalDays: 7,
		staleDays: 14,
		archiveDays: 30
	}
};

export const harnessConfigTemplate = (): string => {
	return `${JSON.stringify(HARNESS_CONFIG_DEFAULTS, null, '\t')}\n`;
};

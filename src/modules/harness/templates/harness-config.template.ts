import type { HarnessConfig } from '@/modules/harness/types/hook.type';

export const HARNESS_CONFIG_DEFAULTS = {
	review: { minToolCalls: 10 },
	memory: {
		maxChars: 4800,
		maxEntryChars: 300
	},
	curator: {
		minLearnedSkills: 10,
		intervalDays: 7,
		staleDays: 14,
		archiveDays: 28
	}
} satisfies HarnessConfig;

export const harnessConfigTemplate = (): string => {
	return `${JSON.stringify(HARNESS_CONFIG_DEFAULTS, null, '\t')}\n`;
};

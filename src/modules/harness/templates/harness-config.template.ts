import type { HarnessConfig } from '@/modules/harness/types/hook.type';

export const HARNESS_CONFIG_DEFAULTS = {
	review: { minToolCalls: 14 },
	memory: {
		maxChars: 9600,
		maxEntryChars: 320
	},
	curator: {
		minLearnedSkills: 10,
		intervalDays: 7,
		staleDays: 14,
		archiveDays: 28
	},
	knowledge: { share: false }
} satisfies HarnessConfig;

export const harnessConfigTemplate = (shareKnowledge: boolean): string => {
	return `${JSON.stringify({
 ...HARNESS_CONFIG_DEFAULTS, knowledge: { share: shareKnowledge } 
}, null, '\t')}\n`;
};

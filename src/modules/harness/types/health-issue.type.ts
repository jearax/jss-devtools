import type { HarnessConfig } from '@/modules/harness/types/hook.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

export type HealthIssueLevel = 'error' | 'warn';

export type HealthIssue = {
	level: HealthIssueLevel;
	label: string;
	detail: string;
	nextStep?: string;
};

export type HealthContext = {
	root: string;
	config: HarnessConfig;
	today: string;
	manifest: InstalledManifest | null;
};

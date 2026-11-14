import type { PackageManagerName } from '@/commands/init/templates/package-json.template';
import type { DetectResult } from 'package-manager-detector';

export type InitMode = 'create' | 'existing';

export type PlanEntryAction = 'create' | 'update' | 'delete';

export type PlanEntry = {
	action: PlanEntryAction;
	path: string;
	content?: string;
};

export type InitPlan = {
	mode: InitMode;
	targetDir: string;
	entries: readonly PlanEntry[];
};

export type InitPreflight = {
	mode: InitMode;
	targetDir: string;
	projectName: string;
	pm: PackageManagerName;
	pmVersion: string;
	packageJson?: {
		parsed: Record<string, unknown>;
	};
};

export type PreflightFolderChecks = {
	mode: InitMode;
	targetDir: string;
	projectName: string;
	detected: DetectResult | null;
	parsed: Record<string, unknown> | undefined;
};

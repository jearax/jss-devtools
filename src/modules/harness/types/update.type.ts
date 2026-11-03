export type HarnessRecordedKind = 'managed' | 'block' | 'config';

export type ManifestFile = {
	path: string;
	kind: HarnessRecordedKind;
	sha256: string;
};

export type InstalledManifest = {
	version: string;
	files: readonly ManifestFile[];
};

export type HarnessRecordedFile = {
	path: string;
	kind: HarnessRecordedKind;
	content: string;
};

export type HarnessSeedFile = {
	path: string;
	content: string;
};

export type HarnessRelease = {
	version: string;
	files: readonly HarnessRecordedFile[];
	seeds?: readonly HarnessSeedFile[];
};

export type UpdateActionKind = 'create' | 'update' | 'delete' | 'conflict';

export type UpdateAction = {
	path: string;
	kind: UpdateActionKind;
	reason: string;
	content?: string;
};

export type UpdatePlan = {
	actions: readonly UpdateAction[];
	conflicts: readonly UpdateAction[];
};

export type UpdateOverrides = Map<string, string>;

export type StagedConflict = {
	path: string;
	kind: HarnessRecordedKind;
	reason: string;
};

export type UpdateSession = {
	schema: 1;
	from: string;
	to: string;
	conflicts: readonly StagedConflict[];
	plan: readonly UpdateAction[];
};

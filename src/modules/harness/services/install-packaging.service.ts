import { PACKAGE } from '@/core/constants/package.constant';
import { HARNESS_BASE_DIR, HARNESS_MANIFEST } from '@/modules/harness/constants/harness-paths.constant';

import { OWNED_FILES, RECORDED_KINDS, sha256 } from './install-plan.service';

import type { HarnessInstallEntry, HarnessInstallInput, HarnessRecordedFile } from './install-plan.service';

const manifestOf = (recorded: readonly HarnessRecordedFile[], version: string): string => {
	const files = recorded.map((file) => {
		return {
			path: file.path,
			kind: file.kind,
			sha256: sha256(file.content)
		};
	});

	return `${JSON.stringify(
		{
			version,
			files
		},
		null,
		'\t'
	)}\n`;
};

const baseEntriesOf = (recorded: readonly HarnessRecordedFile[]): readonly HarnessInstallEntry[] => {
	return recorded.map((file) => {
		return {
			path: `${HARNESS_BASE_DIR}/${file.path}`,
			kind: 'cli' as const,
			content: file.content
		};
	});
};

export const harnessManifestOf = (recorded: readonly HarnessRecordedFile[], version: string): string => {
	return manifestOf(recorded, version);
};

export const harnessBaseEntriesOf = (recorded: readonly HarnessRecordedFile[]): readonly HarnessInstallEntry[] => {
	return baseEntriesOf(recorded);
};

export const harnessInstallEntries = (input: HarnessInstallInput): readonly HarnessInstallEntry[] => {
	const owned = OWNED_FILES(input);

	const recorded = owned
		.filter((file) => {
			return RECORDED_KINDS.has(file.kind);
		})
		.map((file) => {
			return {
				path: file.path,
				kind: file.kind as 'managed' | 'block' | 'config',
				content: file.content
			};
		});

	const manifest = manifestOf(recorded, PACKAGE.version);

	return [
		...owned.map((file) => {
			return {
				path: file.path,
				kind: file.kind,
				content: file.content
			};
		}),
		{
			path: HARNESS_MANIFEST,
			kind: 'cli',
			content: manifest
		},
		...baseEntriesOf(recorded)
	];
};

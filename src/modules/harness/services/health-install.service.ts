import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	HARNESS_BASE_DIR,
	HARNESS_BLOCK_BEGIN,
	HARNESS_BLOCK_END,
	HOOK_SHIM_PATH
} from '@/modules/harness/constants/harness-paths.constant';

import { sha256 } from './install-plan.service';
import { missingHookEntries } from './merge.service';

import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { InstalledManifest } from '@/modules/harness/types/update.type';

const HOOKS_BUNDLE = '.harness/bin/hooks.mjs';

const readOrNull = (path: string): string | null => {
	return existsSync(path) ? readFileSync(path, 'utf8') : null;
};

const baseCopyIssues = (root: string, manifest: InstalledManifest | null): readonly HealthIssue[] => {
	if (manifest === null) {
		return [];
	}

	const broken = manifest.files.filter((file) => {
		const base = readOrNull(join(root, HARNESS_BASE_DIR, file.path));

		return base === null || sha256(base) !== file.sha256;
	});

	if (broken.length === 0) {
		return [];
	}

	return [
		{
			level: 'error' as const,
			label: 'Base copies',
			detail: `${broken
				.map((file) => {
					return file.path;
				})
				.join(', ')} — the merge base does not match the manifest, so \`harness update\` refuses`,
			nextStep: 'Run git checkout .harness/core, then rerun'
		}
	];
};

const installIssues = (context: HealthContext): readonly HealthIssue[] => {
	const { root, manifest } = context;
	const issues: HealthIssue[] = [];

	if (manifest === null) {
		if (context.manifestProblem === null) {
			issues.push({
				level: 'error',
				label: 'Manifest',
				detail: 'No harness manifest here',
				nextStep: 'jss-devtools init'
			});
		} else {
			issues.push({
				level: 'error',
				label: 'Manifest',
				detail: context.manifestProblem
			});
		}
	}

	const claudeMd = readOrNull(join(root, CLAUDE_MD));

	if (claudeMd === null) {
		issues.push({
			level: 'error',
			label: 'CLAUDE.md block',
			detail: 'CLAUDE.md is missing'
		});
	} else if (!claudeMd.includes(HARNESS_BLOCK_BEGIN) || !claudeMd.includes(HARNESS_BLOCK_END)) {
		issues.push({
			level: 'error',
			label: 'CLAUDE.md block',
			detail: 'the harness block markers are missing from CLAUDE.md'
		});
	}

	for (const missing of missingHookEntriesOf(root)) {
		issues.push({
			level: 'error',
			label: 'Hooks in settings.json',
			detail: missing
		});
	}

	for (const detail of hookFileIssuesOf(root, manifest)) {
		issues.push({
			level: 'error',
			label: 'Hook files',
			detail,
			nextStep: 'jss-devtools harness update'
		});
	}

	issues.push(...baseCopyIssues(root, manifest));

	return issues;
};

const missingHookEntriesOf = (root: string): readonly string[] => {
	const settings = readOrNull(join(root, CLAUDE_SETTINGS));

	if (settings === null) {
		return missingHookEntries(null).map((entry) => {
			return `missing harness hook entries in ${CLAUDE_SETTINGS}: ${entry}`;
		});
	}

	const missing = missingHookEntries(settings);

	if (missing.length === 1 && missing[0] === 'settings.json is not valid JSON') {
		return ['settings.json is not valid JSON'];
	}

	return missing.length === 0 ? [] : [`missing harness hook entries in ${CLAUDE_SETTINGS}: ${missing.join(', ')}`];
};

const hookFileIssuesOf = (root: string, manifest: HealthContext['manifest']): readonly string[] => {
	const issues: string[] = [];

	const shim = HOOK_SHIM_PATH;
	const bundle = HOOKS_BUNDLE;

	if (!existsSync(join(root, shim))) {
		issues.push(`${shim} is missing`);
	}

	const bundleLive = readOrNull(join(root, bundle));

	if (bundleLive === null) {
		issues.push(`${bundle} is missing`);

		return issues;
	}

	const recorded = manifest?.files.find((file) => {
		return file.path === bundle;
	});

	if (recorded !== undefined && sha256(bundleLive) !== recorded.sha256) {
		issues.push(`${bundle} differs from the manifest hash`);
	}

	return issues;
};

export { installIssues };

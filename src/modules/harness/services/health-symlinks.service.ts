import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
	CLAUDE_MD,
	CLAUDE_SETTINGS,
	CLAUDE_SKILLS_DIR,
	HARNESS_DIR,
	HARNESS_MEMORY,
	HARNESS_BOOTSTRAP,
	HARNESS_CONFIG,
	HARNESS_CURATOR,
	HARNESS_DECISIONS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_STATE_DIR
} from '@/modules/harness/constants/harness-paths.constant';

import { pathSafetyOf } from './path-safety.service';

import type { HealthIssue } from '@/modules/harness/types/health-issue.type';

// Checked once per hook run; doctor walks all of .harness/ instead.
export const SYMLINK_CHECKS = [
	HARNESS_DIR,
	HARNESS_MEMORY,
	HARNESS_BOOTSTRAP,
	HARNESS_CONFIG,
	HARNESS_CURATOR,
	HARNESS_DECISIONS_DIR,
	HARNESS_DOCS_DIR,
	HARNESS_STATE_DIR,
	CLAUDE_SKILLS_DIR
];

export const unsafeSymlinkPaths = (root: string): string[] => {
	return SYMLINK_CHECKS.flatMap((path) => {
		return pathSafetyOf(root, path).safe ? [] : [path];
	});
};

const walkSymlinks = (root: string, relative: string): string[] => {
	const found: string[] = [];
	const queue = [relative];

	while (queue.length > 0) {
		const current = queue.shift() as string;
		const full = join(root, current);

		let entries;

		try {
			entries = readdirSync(full, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			const child = `${current}/${entry.name}`;

			if (entry.isSymbolicLink()) {
				found.push(child);
			} else if (entry.isDirectory()) {
				queue.push(child);
			}
		}
	}

	return found;
};

export const symlinkIssues = (root: string): readonly HealthIssue[] => {
	const inside = pathSafetyOf(root, HARNESS_DIR).safe
		? walkSymlinks(root, HARNESS_DIR).map((path) => {
				return {
					path,
					level: 'error' as const
				};
			})
		: [
				{
					path: HARNESS_DIR,
					level: 'error' as const
				}
			];

	const skills = existsSync(join(root, CLAUDE_SKILLS_DIR))
		? readdirSync(join(root, CLAUDE_SKILLS_DIR), { withFileTypes: true })
				.filter((entry) => {
					return entry.name.startsWith('harness-');
				})
				.flatMap((entry) => {
					const base = `${CLAUDE_SKILLS_DIR}/${entry.name}`;
					const targets = entry.isSymbolicLink() ? [base] : [`${base}/SKILL.md`];

					return targets.flatMap((target) => {
						try {
							return lstatSync(join(root, target)).isSymbolicLink() ? [target] : [];
						} catch {
							return [];
						}
					});
				})
		: [];

	const top = [CLAUDE_MD, CLAUDE_SETTINGS].filter((path) => {
		try {
			return lstatSync(join(root, path)).isSymbolicLink();
		} catch {
			return false;
		}
	});

	return [
		...inside,
		...skills.map((path) => {
			return {
				path,
				level: 'error' as const
			};
		}),
		...top.map((path) => {
			return {
				path,
				level: 'error' as const
			};
		})
	].map((item) => {
		return {
			level: item.level,
			label: 'Symlinks',
			detail: `${item.path} is a symlink; the harness does not read or write through symlinks`,
			nextStep: 'Replace it with a real file or folder, then rerun jss-devtools harness doctor'
		};
	});
};

export const symlinkWarnings = (root: string): string[] => {
	return unsafeSymlinkPaths(root).map((path) => {
		return `${path} is a symlink; the harness does not read or write through symlinks`;
	});
};

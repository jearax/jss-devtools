import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { gitPublishableFiles } from '@/core/adapters/git.adapter';
import { CLAUDE_MD, CLAUDE_SKILLS_DIR, HARNESS_DIR } from '@/modules/harness/constants/harness-paths.constant';
import { learnedSkillNames } from '@/modules/harness/services/learned-skills.service';
import { findMatches } from '@/modules/harness/services/redaction.service';

import type { HealthIssue } from '@/modules/harness/types/health-issue.type';

const EXCLUDED_DIRS = new Set(['bin', 'core', 'state', 'update']);
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const BINARY_WINDOW_BYTES = 8 * 1024;
const SHOWN_MATCHES = 5;

export type ContentSummary = {
	filesChecked: number;
	allowedLines: number;
};

const walkHarnessFiles = (current: string, rel: string, files: string[]): void => {
	for (const entry of readdirSync(current, { withFileTypes: true })) {
		const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;

		if (entry.isDirectory()) {
			if (!EXCLUDED_DIRS.has(entry.name)) {
				walkHarnessFiles(join(current, entry.name), childRel, files);
			}

			continue;
		}

		if (entry.isFile()) {
			files.push(`${HARNESS_DIR}/${childRel}`);
		}
	}
};

const candidatePaths = (root: string): string[] => {
	const files: string[] = [];
	const harness = join(root, HARNESS_DIR);

	if (existsSync(harness)) {
		walkHarnessFiles(harness, '', files);
	}

	if (existsSync(join(root, CLAUDE_MD))) {
		files.push(CLAUDE_MD);
	}

	for (const name of learnedSkillNames(root)) {
		const folder = join(root, CLAUDE_SKILLS_DIR, name);

		if (!existsSync(folder)) {
			continue;
		}

		for (const entry of readdirSync(folder, { withFileTypes: true })) {
			if (entry.isFile()) {
				files.push(`${CLAUDE_SKILLS_DIR}/${name}/${entry.name}`);
			}
		}
	}

	return files;
};

const issueFor = (findings: readonly string[], hasSecret: boolean): HealthIssue => {
	const shown = findings.slice(0, SHOWN_MATCHES).join(', ');
	const more = findings.length > SHOWN_MATCHES ? `, and ${findings.length - SHOWN_MATCHES} more` : '';

	return {
		level: 'error',
		label: hasSecret ? 'Secrets' : 'Private content',
		detail: `${shown}${more}`,
		nextStep: 'Replace the value, or end the line with harness-doctor: allow'
	};
};

export const contentCheck = async (
	root: string
): Promise<{ issues: readonly HealthIssue[]; summary: ContentSummary }> => {
	const paths = candidatePaths(root);

	if (paths.length === 0) {
		return {
			issues: [],
			summary: {
				filesChecked: 0,
				allowedLines: 0
			}
		};
	}

	const publishable = await gitPublishableFiles(root);
	const published = publishable === null ? null : new Set(publishable);

	const issues: HealthIssue[] = [];
	let allowedLines = 0;
	const perFile = new Map<string, string[]>();
	const secretFiles = new Set<string>();
	let filesChecked = 0;

	for (const path of paths) {
		const full = join(root, path);
		let buffer: Buffer;

		try {
			buffer = readFileSync(full);
		} catch {
			continue;
		}

		if (statSync(full).size > MAX_FILE_BYTES) {
			issues.push({
				level: 'warn',
				label: 'Content check',
				detail: `${path} is larger than 2 MiB and was not checked`
			});

			continue;
		}

		if (buffer.subarray(0, BINARY_WINDOW_BYTES).includes(0)) {
			continue;
		}

		filesChecked += 1;

		const result = findMatches(buffer.toString('utf8'));

		allowedLines += result.allowedLines;

		const isPublished = published === null || published.has(path);
		const findings = perFile.get(path) ?? [];

		for (const match of result.matches) {
			if (match.kind === 'secret') {
				secretFiles.add(path);
			} else if (!isPublished) {
				continue;
			}

			findings.push(`${path}:${match.line} ${match.rule}`);
		}

		if (findings.length > 0) {
			perFile.set(path, findings);
		}
	}

	for (const [path, findings] of perFile) {
		issues.push(issueFor(findings, secretFiles.has(path)));
	}

	return {
		issues,
		summary: {
			filesChecked,
			allowedLines
		}
	};
};

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_DECISIONS_DIR, HARNESS_DIR } from '@/modules/harness/constants/harness-paths.constant';

import { readConfig } from './config.service';
import { decisionFileNames, frontmatterOf } from './decisions.service';
import { indexDrift } from './index-drift.service';
import { memoryLimitProblems, memoryNearCap, readMemoryState } from './memory.service';
import { redactSecrets } from './redaction.service';

import type { HealthContext, HealthIssue } from '@/modules/harness/types/health-issue.type';

const stateIssues = (context: HealthContext): readonly HealthIssue[] => {
	return [
		...configIssues(context.root),
		...memoryIssues(context),
		...driftIssues(context.root),
		...decisionIssues(context.root),
		...secretIssues(context.root)
	];
};

const configIssues = (root: string): readonly HealthIssue[] => {
	return readConfig(root).problems.map((problem) => {
		return {
			level: problem.includes('missing a usable') ? ('warn' as const) : ('error' as const),
			label: 'Config',
			detail: problem
		};
	});
};

const memoryIssues = (context: HealthContext): readonly HealthIssue[] => {
	const memory = readMemoryState(context.root);
	const maxChars = context.config.memory.maxChars;
	const issues: HealthIssue[] = [];

	if (!memory.exists || maxChars === undefined) {
		return issues;
	}

	for (const problem of memoryLimitProblems(memory, maxChars, context.config.memory.maxEntryChars ?? 0)) {
		issues.push({
			level: 'error',
			label: 'Memory',
			detail: problem
		});
	}

	if (memoryNearCap(memory.size, maxChars)) {
		issues.push({
			level: 'warn',
			label: 'Memory',
			detail: `MEMORY.md is at ${Math.round((memory.size / maxChars) * 100)}% of its ${maxChars} char limit — run the harness-curate skill`
		});
	}

	return issues;
};

const driftIssues = (root: string): readonly HealthIssue[] => {
	return indexDrift(root).map((drift) => {
		return {
			level: 'warn' as const,
			label: 'Index',
			detail: drift
		};
	});
};

const decisionIssues = (root: string): readonly HealthIssue[] => {
	const dir = join(root, HARNESS_DECISIONS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	const issues: HealthIssue[] = [];

	for (const name of decisionFileNames(root)) {
		const text = readFileSync(join(dir, name), 'utf8');
		const frontmatter = frontmatterOf(text);

		const missing = (['title', 'status'] as const).filter((key) => {
			return !new RegExp(`^${key}:\\s*\\S`, 'm').test(frontmatter);
		});

		for (const key of missing) {
			issues.push({
				level: 'warn',
				label: 'Decisions',
				detail: `${name} has no ${key} in its frontmatter`
			});
		}

		if (!/^> /m.test(text)) {
			issues.push({
				level: 'warn',
				label: 'Decisions',
				detail: `${name} has no quote of the user`
			});
		}
	}

	return issues;
};

const secretIssues = (root: string): readonly HealthIssue[] => {
	const dir = join(root, HARNESS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	const issues: HealthIssue[] = [];

	const walk = (current: string, rel: string): void => {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
			const child = join(current, entry.name);

			if (entry.isDirectory()) {
				walk(child, childRel);

				continue;
			}

			if (!entry.isFile()) {
				continue;
			}

			const text = readFileSync(child, 'utf8');

			if (redactSecrets(text) !== text) {
				issues.push({
					level: 'error',
					label: 'Secrets',
					detail: `${HARNESS_DIR}/${childRel} holds a secret-shaped value`
				});
			}
		}
	};

	walk(dir, '');

	return issues;
};

export { stateIssues };

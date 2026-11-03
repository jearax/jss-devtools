import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { gitWorktreeChanges } from '@/core/adapters/git.adapter';
import { CLAUDE_SKILLS_DIR, HARNESS_SKILL_USAGE } from '@/modules/harness/constants/harness-paths.constant';

import { usesAgentKit } from './agent-kit.service';
import { frontmatterOf } from './decisions.service';
import { learnedSkillNames } from './learned-skills.service';
import { dayDiff } from './skill-usage.service';

import type { HealthIssue } from '@/modules/harness/types/health-issue.type';
import type { HarnessConfig } from '@/modules/harness/types/hook.type';

const RESERVED_PREFIXES = ['ak-', 'harness-'] as const;

const frontmatterName = (text: string): string => {
	return (
		frontmatterOf(text)
			.match(/^name:\s*(.+)$/m)?.[1]
			?.trim() ?? ''
	);
};

const reservedPrefix = (name: string): string | null => {
	return (
		RESERVED_PREFIXES.find((prefix) => {
			return name.startsWith(prefix);
		}) ?? null
	);
};

const learnedSkillIssues = (root: string, config: HarnessConfig, today: string): readonly HealthIssue[] => {
	const issues: HealthIssue[] = [];
	const usage = usageOf(root);
	const staleDays = config.curator.staleDays;

	for (const name of learnedSkillNames(root)) {
		const path = join(root, CLAUDE_SKILLS_DIR, name, 'SKILL.md');
		const text = readFileSync(path, 'utf8');
		const skillName = frontmatterName(text);
		const prefix = reservedPrefix(skillName) ?? reservedPrefix(name);

		if (skillName === '') {
			issues.push({
				level: 'error',
				label: 'Learned skills',
				detail: `${name}/SKILL.md has invalid frontmatter`
			});

			continue;
		}

		if (prefix !== null) {
			issues.push({
				level: 'error',
				label: 'Learned skills',
				detail: `${name} ${RESERVED_MESSAGE(prefix)}`
			});

			continue;
		}

		if (isPinned(text) || staleDays === undefined) {
			continue;
		}

		const last = usage[name];
		const days = last === undefined ? null : dayDiff(last, today);

		if (days === null) {
			issues.push({
				level: 'warn',
				label: 'Learned skills',
				detail: `${name} never used — consider \`harness-curate\``
			});

			continue;
		}

		if (days > staleDays) {
			issues.push({
				level: 'warn',
				label: 'Learned skills',
				detail: `${name} unused for ${days} days — consider \`harness-curate\``
			});
		}
	}

	return issues;
};

const RESERVED_MESSAGE = (prefix: string): string => {
	return `uses a reserved prefix (${prefix}) — rename it away from ${prefix}`;
};

const isPinned = (text: string): boolean => {
	return /^\s*harness-pinned:\s*"?"true"?\s*$/m.test(text);
};

const usageOf = (root: string): Record<string, string> => {
	const path = join(root, HARNESS_SKILL_USAGE);

	if (!existsSync(path)) {
		return {};
	}

	try {
		return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
	} catch {
		return {};
	}
};

const akSkillIssues = async (root: string): Promise<readonly HealthIssue[]> => {
	if (!usesAgentKit(root)) {
		return [];
	}

	const changes = await gitWorktreeChanges(root);

	if (changes.kind !== 'ok') {
		return [];
	}

	const touched = changes.status.split('\0').some((chunk) => {
		return chunk.slice(3).startsWith(`${CLAUDE_SKILLS_DIR}/ak-`);
	});

	if (!touched) {
		return [];
	}

	return [
		{
			level: 'warn',
			label: 'AgentKit skills',
			detail: 'uncommitted changes under .claude/skills/ak-* — `ak update` overwrites them'
		}
	];
};

export { akSkillIssues, learnedSkillIssues };

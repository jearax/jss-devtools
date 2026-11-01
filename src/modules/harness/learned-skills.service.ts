import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CLAUDE_SKILLS_DIR } from './constants/harness-paths.constant';

export const learnedSkillNames = (root: string): string[] => {
	const dir = join(root, CLAUDE_SKILLS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => {
			return entry.isDirectory();
		})
		.map((entry) => {
			return entry.name;
		})
		.filter((name) => {
			const skill = join(dir, name, 'SKILL.md');

			return existsSync(skill) && /^\s*harness-origin:\s*learned$/m.test(readFileSync(skill, 'utf8'));
		});
};

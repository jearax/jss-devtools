import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_DECISIONS_DIR } from '@/modules/harness/constants/harness-paths.constant';

export type DecisionInfo = {
	id: string;
	title: string;
};

const DECISION_FILE = /^(\d{4})-.+\.md$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

export const frontmatterOf = (text: string): string => {
	return text.match(FRONTMATTER)?.[1] ?? '';
};

const frontmatterValue = (block: string, key: string): string => {
	const match = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));

	return match?.[1]?.trim() ?? '';
};

export const decisionFileIds = (root: string): string[] => {
	return decisionFileNames(root).map((name) => {
		return name.slice(0, 4);
	});
};

export const decisionFileNames = (root: string): string[] => {
	const dir = join(root, HARNESS_DECISIONS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir).filter((name) => {
		return DECISION_FILE.test(name);
	});
};

export const decisionsInForce = (root: string): DecisionInfo[] => {
	const dir = join(root, HARNESS_DECISIONS_DIR);

	return decisionFileNames(root)
		.map((name) => {
			const text = readFileSync(join(dir, name), 'utf8');
			const frontmatter = frontmatterOf(text);

			return {
				id: name.slice(0, 4),
				title: frontmatterValue(frontmatter, 'title') || name,
				status: frontmatterValue(frontmatter, 'status')
			};
		})
		.filter((decision) => {
			return !/^Superseded/i.test(decision.status);
		})
		.map(({ id, title }) => {
			return {
				id,
				title
			};
		});
};

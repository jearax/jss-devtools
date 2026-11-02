import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_DECISIONS_DIR, HARNESS_DOCS_DIR } from '@/modules/harness/constants/harness-paths.constant';

import { usesAgentKit } from './agent-kit.service';
import { decisionFileIds } from './decisions.service';

const tableCells = (readme: string): string[][] => {
	return readme
		.split('\n')
		.filter((line) => {
			return line.startsWith('|');
		})
		.map((line) => {
			return line
				.split('|')
				.slice(1, -1)
				.map((cell) => {
					return cell.trim();
				});
		});
};

const rowNames = (readme: string): string[] => {
	return tableCells(readme)
		.filter((cells) => {
			return cells.length >= 1;
		})
		.map((cells) => {
			return cells[0] ?? '';
		})
		.filter((name) => {
			return name !== '' && !/^-+$/.test(name) && name !== 'Doc' && name !== '#';
		});
};

const decisionRows = (readme: string): string[] => {
	return rowNames(readme)
		.map((cell) => {
			return cell.match(/\d{4}/)?.[0] ?? '';
		})
		.filter((id) => {
			return id !== '';
		});
};

const docRowNames = (readme: string): string[] => {
	return rowNames(readme).map((cell) => {
		return cell.replace(/^\[|\]\([^)]*\)$/g, '').replace(/\.md$/, '');
	});
};

const decisionsDrift = (root: string): string[] => {
	const dir = join(root, HARNESS_DECISIONS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	const readmePath = join(dir, 'README.md');
	const files = decisionFileIds(root);
	const rows = existsSync(readmePath) ? decisionRows(readFileSync(readmePath, 'utf8')) : [];

	const missing = files.filter((id) => {
		return !rows.includes(id);
	});

	const orphaned = rows.filter((id) => {
		return !files.includes(id);
	});

	const drift: string[] = [];

	if (missing.length > 0) {
		drift.push(`decisions/README.md is missing rows for: ${missing.join(', ')}`);
	}

	if (orphaned.length > 0) {
		drift.push(`decisions/README.md has rows with no file: ${orphaned.join(', ')}`);
	}

	return drift;
};

const docsDrift = (root: string): string[] => {
	const dir = join(root, HARNESS_DOCS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	const readmePath = join(dir, 'README.md');

	const files = readdirSync(dir)
		.filter((name) => {
			return name.endsWith('.md') && name !== 'README.md';
		})
		.map((name) => {
			return name.replace(/\.md$/, '');
		});

	const rows = existsSync(readmePath) ? docRowNames(readFileSync(readmePath, 'utf8')) : [];
	const drift: string[] = [];

	const missing = files.filter((name) => {
		return !rows.includes(name);
	});

	if (missing.length > 0) {
		drift.push(`docs/README.md is missing rows for: ${missing.join(', ')}`);
	}

	const orphaned = rows.filter((name) => {
		return !files.includes(name);
	});

	if (orphaned.length > 0) {
		drift.push(`docs/README.md has rows with no file: ${orphaned.join(', ')}`);
	}

	return drift;
};

export const indexDrift = (root: string): string[] => {
	return [...decisionsDrift(root), ...(usesAgentKit(root) ? [] : docsDrift(root))];
};

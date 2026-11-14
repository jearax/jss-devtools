import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { HARNESS_DECISIONS_DIR, HARNESS_DOCS_DIR } from '@/modules/harness/constants/harness-paths.constant';

import { usesAgentKit } from './agent-kit.service';
import { decisionFileIds } from './decisions.service';
import { safeReadFile } from './path-safety.service';

type Row = string[];

const cellsOf = (line: string): Row => {
	return line
		.split('|')
		.slice(1, -1)
		.map((cell) => {
			return cell.trim();
		});
};

const tablesOf = (readme: string): Row[][] => {
	const tables: Row[][] = [];
	let current: Row[] | null = null;

	for (const line of readme.split('\n')) {
		if (!line.startsWith('|')) {
			current = null;

			continue;
		}

		if (current === null) {
			current = [];

			tables.push(current);
		}

		current.push(cellsOf(line));
	}

	return tables;
};

const tableWithHeader = (readme: string, firstCell: string): Row[] => {
	const table = tablesOf(readme).find((rows) => {
		return rows[0]?.[0] === firstCell;
	});

	if (table === undefined) {
		return [];
	}

	return table.slice(1).filter((cells) => {
		return !/^-+$/.test(cells[0] ?? '');
	});
};

const linkTextOf = (cell: string): string => {
	return cell.replace(/^\[/, '').replace(/\]\([^)]*\)$/, '');
};

const decisionRows = (readme: string): string[] => {
	return tableWithHeader(readme, '#')
		.map((cells) => {
			return linkTextOf(cells[0] ?? '');
		})
		.filter((id) => {
			return /^\d{4}$/.test(id);
		});
};

const docRowNames = (readme: string): string[] => {
	return tableWithHeader(readme, 'Doc')
		.map((cells) => {
			return linkTextOf(cells[0] ?? '').replace(/\.md$/, '');
		})
		.filter((name) => {
			return name !== '';
		});
};

const decisionsDrift = (root: string): string[] => {
	const dir = join(root, HARNESS_DECISIONS_DIR);

	if (!existsSync(dir)) {
		return [];
	}

	const files = decisionFileIds(root);
	const readme = safeReadFile(root, `${HARNESS_DECISIONS_DIR}/README.md`);
	const rows = readme === null ? [] : decisionRows(readme);

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

	const files = readdirSync(dir)
		.filter((name) => {
			return name.endsWith('.md') && name !== 'README.md';
		})
		.map((name) => {
			return name.replace(/\.md$/, '');
		});

	const readme = safeReadFile(root, `${HARNESS_DOCS_DIR}/README.md`);
	const rows = readme === null ? [] : docRowNames(readme);
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

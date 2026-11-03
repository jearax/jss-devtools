import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { indexDrift } from '@/modules/harness/services/index-drift.service';

import { makeEmptyDir } from './support/tmp-dir';

const write = (root: string, rel: string, content: string): void => {
	const full = join(root, rel);

	mkdirSync(dirname(full), {
		recursive: true
	});

	writeFileSync(full, content);
};

const DECISIONS_README = [
	'# Decisions',
	'',
	'| #   | Title            | Status   | Date       |',
	'| --- | ---------------- | -------- | ---------- |',
	'| 0001 | [First](0001-a.md) | accepted | 2026-11-01 |',
	'',
	'| Date       | Note                  |',
	'| ---------- | --------------------- |',
	'| 2026-11-03 | a row that is not a decision |',
	''
].join('\n');

describe('the index drift of the decisions', () => {
	it('reads the decisions table and ignores a second table', async () => {
		const root = await makeEmptyDir();

		write(root, '.harness/decisions/README.md', DECISIONS_README);
		write(root, '.harness/decisions/0001-a.md', '---\nid: 0001\ntitle: First\nstatus: accepted\n---\n\n> do it\n');

		expect(indexDrift(root)).toEqual([]);
	});

	it('still reports a decision file with no row', async () => {
		const root = await makeEmptyDir();

		write(root, '.harness/decisions/README.md', DECISIONS_README);
		write(root, '.harness/decisions/0001-a.md', '---\nid: 0001\ntitle: First\nstatus: accepted\n---\n\n> do it\n');
		write(root, '.harness/decisions/0002-b.md', '---\nid: 0002\ntitle: Second\nstatus: accepted\n---\n\n> do it\n');

		expect(indexDrift(root)).toEqual(['decisions/README.md is missing rows for: 0002']);
	});

	it('reports a row whose id has no file', async () => {
		const root = await makeEmptyDir();

		write(
			root,
			'.harness/decisions/README.md',
			[
				'# Decisions',
				'',
				'| # | Title | Status | Date |',
				'|---|---|---|---|',
				'| 0009 | Ghost | accepted | 2026-11-01 |',
				''
			].join('\n')
		);

		expect(indexDrift(root)).toEqual(['decisions/README.md has rows with no file: 0009']);
	});
});

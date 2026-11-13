import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

import { describe, expect, it } from 'vitest';

const NEST_TEMPLATE_DIR = 'templates/nest';
// Read as text: the CLI suite must not import from the site project (decision 0025 keeps `@/`
// mapped to `src/`, which this test does not own), and each parse is deliberately narrow.
const NEST_PAGE_CONSTANT = 'site/src/pages/Docs/pages/Nest/Nest.constant.ts';

const pageConstantText = (): string => {
	return readFileSync(NEST_PAGE_CONSTANT, 'utf8');
};

const templateScripts = (): [string, string][] => {
	const manifest = JSON.parse(readFileSync(join(NEST_TEMPLATE_DIR, 'package.json'), 'utf8')) as {
		scripts: Record<string, string>;
	};

	return Object.entries(manifest.scripts);
};

const constantScripts = (): [string, string][] => {
	const text = pageConstantText();
	const match = /export const NEST_SCRIPTS = `([\s\S]*?)`;/.exec(text);

	expect(match, 'Nest.constant.ts declares NEST_SCRIPTS').not.toBeNull();

	// The block keeps the template literal's `\\"` escapes; evaluate them before JSON.parse.
	const json = match![1]!.replace(/\\\\/g, '\\');

	return Object.entries(JSON.parse(json) as Record<string, string>);
};

const envExampleRows = (): { name: string; value: string }[] => {
	const text = readFileSync(join(NEST_TEMPLATE_DIR, '.env.example'), 'utf8');

	return text
		.split('\n')
		.map((line) => {
			return /^(?<name>[A-Z_]+)=(?<value>.*)$/.exec(line.trim());
		})
		.filter((match): match is RegExpExecArray => {
			return match !== null;
		})
		.map((match) => {
			return {
				name: match.groups!['name']!,
				value: match.groups!['value']!
			};
		});
};

const envTableRows = (): { name: string; default: string }[] => {
	const text = pageConstantText();
	const start = text.indexOf('export const NEST_ENV_ROWS');

	expect(start, 'Nest.constant.ts declares NEST_ENV_ROWS').toBeGreaterThan(-1);

	const end = text.indexOf('];', start);

	// A silent empty match would prove nothing; the length asserts below fail loudly on one.
	const rows = [...text.slice(start, end).matchAll(/name: '([^']+)',\s*default: '([^']*)'/g)].map((match) => {
		return {
			name: match[1]!,
			default: match[2]!
		};
	});

	expect(rows.length, 'the page table parses to at least one row').toBeGreaterThan(0);

	return rows;
};

/** Every file under `templates/nest/src`, relative and slash-normalised, spec files excluded. */
const templateSrcFiles = (): string[] => {
	const walk = (dir: string, prefix: string): string[] => {
		return readdirSync(dir).flatMap((entry) => {
			const full = join(dir, entry);
			const relative = prefix === '' ? entry : `${prefix}/${entry}`;

			if (statSync(full).isDirectory()) {
				return walk(full, relative);
			}

			return relative.endsWith('.spec.ts') ? [] : [relative];
		});
	};

	return walk(join(NEST_TEMPLATE_DIR, 'src'), 'src');
};

/**
 * The paths the page's tree states, rebuilt from its indentation: `src/` at depth 0, one folder
 * level per two spaces, and a line may carry its parent folders itself (`config/config.service.ts`).
 */
const treePaths = (): string[] => {
	const text = pageConstantText();
	const match = /export const NEST_TREE = `([\s\S]*?)`;/.exec(text);

	expect(match, 'Nest.constant.ts declares NEST_TREE').not.toBeNull();

	const lines = match![1]!
		.split('\n')
		.slice(1)
		.filter((line) => {
			return line.trim() !== '';
		});

	const stack = ['src'];
	const paths: string[] = [];

	for (const line of lines) {
		const depth = (line.length - line.trimStart().length) / 2;
		const entry = line.trim();

		stack.length = depth;

		if (entry.endsWith('/')) {
			stack.push(entry.slice(0, -1));
			continue;
		}

		paths.push(posix.join(...stack, entry));
	}

	expect(paths.length, 'the tree parses to at least one file').toBeGreaterThan(0);

	return paths;
};

describe('the site nest docs page facts', () => {
	it('keeps the env table equal to the example env file in names, order and defaults', () => {
		const example = envExampleRows();

		expect(example.length, 'the example env file declares at least one variable').toBeGreaterThan(0);

		const table = envTableRows();

		expect(
			table.map((row) => {
				return row.name;
			})
		).toEqual(
			example.map((row) => {
				return row.name;
			})
		);

		for (const [index, row] of table.entries()) {
			expect(row.default, `${row.name} keeps the shipped default`).toBe(example[index]!.value);
		}
	});

	it('keeps the scripts block equal to the template manifest scripts, in order and value', () => {
		expect(constantScripts()).toEqual(templateScripts());
	});

	it('keeps the src tree equal to the template files, specs excluded', () => {
		const stated = treePaths().sort();
		const actual = templateSrcFiles().sort();

		expect(
			stated.filter((path) => {
				return !actual.includes(path);
			})
		).toEqual([]);
		expect(
			actual.filter((path) => {
				return !stated.includes(path);
			})
		).toEqual([]);
	});
});

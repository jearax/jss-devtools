import { describe, expect, it } from 'vitest';

import { applyCommandLineOf } from '@/commands/harness/update.command';
import { hasConflictMarkers } from '@/modules/harness/services/block-region.service';
import { mergeHarnessConfig, missingConfigKeys } from '@/modules/harness/services/config-merge.service';
import { mergeThreeWay } from '@/modules/harness/services/three-way-merge.service';
import { HARNESS_CONFIG_DEFAULTS } from '@/modules/harness/templates/harness-config.template';

import type { Command } from 'commander';

const line = (text: string): string => {
	return `${text}\n`;
};

describe('the three-way merge', () => {
	it('takes upstream when local equals base', async () => {
		const result = await mergeThreeWay(line('a'), line('a'), line('b'));

		expect(result).toEqual({
			content: line('b'),
			conflicted: false
		});
	});

	it('keeps local when upstream equals base', async () => {
		const result = await mergeThreeWay(line('a'), line('b'), line('b'));

		expect(result).toEqual({
			content: line('a'),
			conflicted: false
		});
	});

	it('keeps local when local already equals upstream', async () => {
		const result = await mergeThreeWay(line('b'), line('a'), line('b'));

		expect(result).toEqual({
			content: line('b'),
			conflicted: false
		});
	});

	it('joins edits at opposite ends', async () => {
		const base = ['one', 'two', 'three'].map(line).join('');
		const local = ['one', 'two', 'three', 'local'].map(line).join('');
		const upstream = ['upstream', 'one', 'two', 'three'].map(line).join('');

		const result = await mergeThreeWay(local, base, upstream);

		expect(result.conflicted).toBe(false);
		expect(result.content).toBe(['upstream', 'one', 'two', 'three', 'local'].map(line).join(''));
	});

	it('reports overlapping edits as conflicted text with markers', async () => {
		const base = ['one', 'two'].map(line).join('');
		const local = ['changed local', 'two'].map(line).join('');
		const upstream = ['changed upstream', 'two'].map(line).join('');

		const result = await mergeThreeWay(local, base, upstream);

		expect(result.conflicted).toBe(true);
		expect(result.content).toContain('<<<<<<<');
		expect(result.content).toContain('changed local');
		expect(result.content).toContain('changed upstream');
		expect(result.content).toContain('>>>>>>>');
	});
});

describe('conflict marker detection', () => {
	it('sees the labelled markers', () => {
		expect(hasConflictMarkers(line('<<<<<<< HEAD'))).toBe(true);
		expect(hasConflictMarkers(line('>>>>>>> other'))).toBe(true);
	});

	it('ignores a bare Markdown heading rule', () => {
		expect(hasConflictMarkers('Heading\n=======\n')).toBe(false);
	});
});

const configWith = (values: Record<string, unknown>): string => {
	return `${JSON.stringify(values, null, '\t')}\n`;
};

const DEFAULTS = HARNESS_CONFIG_DEFAULTS;

describe('the config merge', () => {
	it('takes the new default for an untouched key and keeps an edited key', () => {
		const base = configWith({ review: { minToolCalls: 5 } });
		const local = configWith({ review: { minToolCalls: 5 } });

		const result = mergeHarnessConfig(base, local);

		expect(result.conflictKeys).toEqual([]);
		expect(JSON.parse(result.content)).toEqual({
			...DEFAULTS,
			review: { ...DEFAULTS.review }
		});
	});

	it('repairs a missing key with its default', () => {
		const base = configWith({
			memory: {
				...DEFAULTS.memory
			}
		});

		const local = configWith({ memory: { maxChars: DEFAULTS.memory.maxChars } });

		const result = mergeHarnessConfig(base, local);

		expect(result.conflictKeys).toEqual([]);
		expect(JSON.parse(result.content)).toEqual(DEFAULTS);
	});

	it('repairs a missing key even without a base copy', () => {
		const result = mergeHarnessConfig(null, configWith({}));

		expect(result.conflictKeys).toEqual([]);
		expect(JSON.parse(result.content)).toEqual(DEFAULTS);
	});

	it('reports a key both sides changed to different values and keeps the local value', () => {
		const base = configWith({ curator: { intervalDays: 3 } });
		const local = configWith({ curator: { intervalDays: 14 } });

		const result = mergeHarnessConfig(base, local);

		expect(result.conflictKeys).toEqual(['curator.intervalDays']);
		expect(JSON.parse(result.content)).toEqual({
			...DEFAULTS,
			curator: {
				...DEFAULTS.curator,
				intervalDays: 14
			}
		});
	});

	it('keeps an edited key when the upstream default did not move', () => {
		const base = configWith({ curator: { intervalDays: 7 } });
		const local = configWith({ curator: { intervalDays: 14 } });

		const result = mergeHarnessConfig(base, local);

		expect(result.conflictKeys).toEqual([]);
		expect(JSON.parse(result.content)).toEqual({
			...DEFAULTS,
			curator: {
				...DEFAULTS.curator,
				intervalDays: 14
			}
		});
	});

	it('keeps unknown keys and groups untouched', () => {
		const base = configWith({ extra: { keep: true } });
		const local = configWith({ extra: { keep: true } });

		const result = mergeHarnessConfig(base, local);

		expect(result.conflictKeys).toEqual([]);
		expect(JSON.parse(result.content)).toEqual({
			...DEFAULTS,
			extra: { keep: true }
		});
	});

	it('lists the keys missingConfigKeys finds', () => {
		expect(missingConfigKeys(configWith({}))).toEqual([
			'review.minToolCalls',
			'memory.maxChars',
			'memory.maxEntryChars',
			'curator.minLearnedSkills',
			'curator.intervalDays',
			'curator.staleDays',
			'curator.archiveDays'
		]);
		expect(missingConfigKeys(`${JSON.stringify(DEFAULTS, null, '\t')}\n`)).toEqual([]);
	});
});

describe('the update apply command line', () => {
	const commandWith = (rawArgs: readonly string[]): Command => {
		return {
			name: () => {
				return 'update';
			},
			parent: { rawArgs }
		} as unknown as Command;
	};

	it('keeps an empty argument quoted in the apply line', () => {
		const line = applyCommandLineOf(commandWith(['node', 'jss-devtools', 'update', '']));

		expect(line).toBe("jss-devtools update ''");
	});

	it('leaves plain words unquoted', () => {
		const line = applyCommandLineOf(commandWith(['node', 'jss-devtools', 'update', '-y']));

		expect(line).toBe('jss-devtools update -y');
	});
});

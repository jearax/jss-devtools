import { describe, expect, it } from 'vitest';

import { parseAnsi, stripAnsi } from '@/components/Terminal/ansi.util';

const ESC = String.fromCodePoint(27);

describe('parseAnsi', () => {
	it('splits a line into segments that carry the codes the CLI printed', () => {
		const line = `${ESC}[90m│${ESC}[39m  ${ESC}[32m+${ESC}[39m ${ESC}[2m.claude/${ESC}[22msettings.json`;

		expect(parseAnsi(line)).toEqual([
			{
				text: '│',
				color: 'muted',
				dim: false,
				bold: false,
				inverse: false
			},
			{
				text: '  ',
				color: null,
				dim: false,
				bold: false,
				inverse: false
			},
			{
				text: '+',
				color: 'success',
				dim: false,
				bold: false,
				inverse: false
			},
			{
				text: ' ',
				color: null,
				dim: false,
				bold: false,
				inverse: false
			},
			{
				text: '.claude/',
				color: null,
				dim: true,
				bold: false,
				inverse: false
			},
			{
				text: 'settings.json',
				color: null,
				dim: false,
				bold: false,
				inverse: false
			}
		]);
	});

	it('turns inverse on and off, and resets everything on code 0', () => {
		const segments = parseAnsi(`${ESC}[7;32m title ${ESC}[0mrest`);

		expect(segments[0]).toMatchObject({
			text: ' title ',
			color: 'success',
			inverse: true
		});
		expect(segments[1]).toMatchObject({
			text: 'rest',
			color: null,
			inverse: false
		});
	});

	it('drops codes it does not map instead of printing them', () => {
		expect(stripAnsi(`${ESC}[4munderlined${ESC}[24m`)).toBe('underlined');
		expect(parseAnsi(`${ESC}[4munderlined${ESC}[24m`)).toEqual([
			{
				text: 'underlined',
				color: null,
				dim: false,
				bold: false,
				inverse: false
			}
		]);
	});
});

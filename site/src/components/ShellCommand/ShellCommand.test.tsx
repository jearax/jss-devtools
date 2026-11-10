import { describe, expect, it } from 'vitest';

import { highlightCommand } from '@/components/ShellCommand/shell-command.util';

const programs = (command: string) => {
	return highlightCommand(command)
		.filter((word) => {
			return word.program;
		})
		.map((word) => {
			return word.text;
		});
};

describe('highlightCommand', () => {
	it('marks the program that starts each pipeline stage, and keeps every character', () => {
		const command = 'curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh';

		expect(programs(command)).toEqual(['curl', 'sh']);
		expect(
			highlightCommand(command)
				.map((word) => {
					return word.text;
				})
				.join('')
		).toBe(command);
	});

	it('marks only the first word of a single command', () => {
		expect(programs('jss-devtools init my-app --pm pnpm')).toEqual(['jss-devtools']);
	});
});

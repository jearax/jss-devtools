import { styleText } from 'node:util';

import { helpTitle } from './terminal.ui';

export type HelpExampleRow = readonly [command: string, description: string];

export const examplesText = (rows: readonly HelpExampleRow[]): (() => string) => {
	return () => {
		const width = Math.max(
			...rows.map(([command]) => {
				return command.length;
			})
		);

		return [
			'',
			helpTitle('Examples:'),
			...rows.map(([command, description]) => {
				const gap = ' '.repeat(width - command.length + 1);

				return `  ${styleText('dim', '$ ')}${styleText('cyan', command)}${gap}${description}`;
			})
		].join('\n');
	};
};

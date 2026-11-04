import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import CopyButton from './CopyButton';

describe('CopyButton', () => {
	it('announces what it copies', async () => {
		const screen = await render(
			<CopyButton label="Copy the install command" value="curl -fsSL https://example.test/install.sh | sh" />,
			{
				wrapper: ThemeProvider
			}
		);

		await expect.element(screen.getByRole('button', { name: 'Copy the install command' })).toBeInTheDocument();
	});

	it('puts the value on the clipboard', async () => {
		const screen = await render(<CopyButton label="Copy the doctor command" value="jss-devtools doctor" />, {
			wrapper: ThemeProvider
		});

		await screen.getByRole('button', { name: 'Copy the doctor command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe('jss-devtools doctor');
	});

	it('says so once the value is copied', async () => {
		const screen = await render(<CopyButton label="Copy the doctor command" value="jss-devtools doctor" />, {
			wrapper: ThemeProvider
		});

		await screen.getByRole('button', { name: 'Copy the doctor command' }).click();

		await expect.element(screen.getByText('Copied')).toBeInTheDocument();
	});
});

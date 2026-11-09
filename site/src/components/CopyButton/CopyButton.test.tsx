import { ThemeProvider } from '@jjuidev/react';
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

	it('in icon feedback shows the icon only, and still copies', async () => {
		const screen = await render(<CopyButton feedback="icon" label="Copy the command" value="jss-devtools doctor" />, {
			wrapper: ThemeProvider
		});

		const button = screen.getByRole('button', { name: 'Copy the command' });

		await expect.element(button).toBeInTheDocument();

		// Icon-only: the state lives in the accessible name and a screen-reader line, not as text.
		expect(screen.container.querySelector('button')?.textContent).toBe('');

		await button.click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe('jss-devtools doctor');

		await expect.element(screen.getByRole('button', { name: 'Copied. Copy the command' })).toBeInTheDocument();
	});
});

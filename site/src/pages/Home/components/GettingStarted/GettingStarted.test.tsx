import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import GettingStarted from './GettingStarted';

describe('GettingStarted', () => {
	it('opens with the Getting started heading and nothing above it', async () => {
		const screen = await render(<GettingStarted />, { wrapper: ThemeProvider });

		await expect.element(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('Three commands');
	});

	it('shows the first run, one step at a time', async () => {
		const screen = await render(<GettingStarted />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('Install the CLI')).toBeInTheDocument();
		await expect.element(screen.getByText('Check the machine')).toBeInTheDocument();
		await expect.element(screen.getByText('Set up a project')).toBeInTheDocument();
	});

	it('copies the doctor command', async () => {
		const screen = await render(<GettingStarted />, { wrapper: ThemeProvider });

		await screen.getByRole('button', { name: 'Copy the doctor command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe('jss-devtools doctor');
	});

	it('links to the getting started guide', async () => {
		const screen = await render(<GettingStarted />, { wrapper: ThemeProvider });

		await expect
			.element(screen.getByRole('link', { name: 'Read the getting started guide' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});

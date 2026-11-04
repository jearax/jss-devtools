import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { INSTALL_COMMAND } from '@/constants/cli.constant';
import { VALUE_LINE } from '@/pages/Home/Home.constant';

import Hero from './Hero';

describe('Hero', () => {
	it('shows the headline and the value line', async () => {
		const screen = await render(<Hero />, { wrapper: ThemeProvider });

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();
		await expect.element(screen.getByText(VALUE_LINE)).toBeInTheDocument();
	});

	it('shows the install command in a terminal window', async () => {
		const screen = await render(<Hero />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('install.sh')).toBeInTheDocument();
		await expect.element(screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/)).toBeInTheDocument();
	});

	it('copies the install command', async () => {
		const screen = await render(<Hero />, { wrapper: ThemeProvider });

		await screen.getByRole('button', { name: 'Copy the install command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(INSTALL_COMMAND);
	});

	it('offers a way into the docs', async () => {
		const screen = await render(<Hero />, { wrapper: ThemeProvider });

		await expect
			.element(screen.getByRole('link', { name: 'Get started' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});

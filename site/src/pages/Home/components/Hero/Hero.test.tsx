import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { INSTALL_COMMAND, PRODUCT_NAME } from '@/constants/cli.constant';
import { HERO_TERMINAL_TABS, VALUE_LINES } from '@/pages/Home/Home.constant';

import Hero from './Hero';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('Hero', () => {
	it('shows the headline and the value lines, and no eyebrow wordmark', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();

		for (const line of VALUE_LINES) {
			await expect.element(screen.getByText(line)).toBeInTheDocument();
		}

		// Decision 1: the header's logo carries the name, so the hero has no eyebrow wordmark.
		expect(screen.container.querySelector('[class*="eyebrow"]')).toBeNull();
	});

	it('shows the install command in a tabbed terminal window titled by the CLI', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByText(PRODUCT_NAME)).toBeInTheDocument();
		await expect.element(screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/)).toBeInTheDocument();

		for (const tab of HERO_TERMINAL_TABS) {
			await expect.element(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
		}
	});

	it('copies the install command from the icon in the command row', async () => {
		const screen = await render(<Hero />, { wrapper });

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(INSTALL_COMMAND);
	});

	it('links to the getting started guide below the terminal', async () => {
		const screen = await render(<Hero />, { wrapper });

		// Decision 2: the getting started section is a button in the hero now.
		await expect
			.element(screen.getByRole('link', { name: 'Getting started' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});

	it('replays the transcript when the reader switches tabs', async () => {
		const screen = await render(<Hero />, { wrapper });

		await screen.getByRole('tab', { name: 'doctor' }).click();

		await expect.element(screen.getByText(/Ready: Node\.js, git and 4 package managers/)).toBeInTheDocument();
	});
});

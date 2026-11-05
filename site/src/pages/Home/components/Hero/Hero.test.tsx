import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
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

		// The tabs are named after working directories, so two can share the label `~`.
		const tabs = [...screen.container.querySelectorAll('button[role="tab"]')];

		expect(tabs.length).toBe(HERO_TERMINAL_TABS.length);

		const labels = tabs.map((tab) => {
			return tab.textContent;
		});

		for (const label of new Set(
			HERO_TERMINAL_TABS.map((tab) => {
				return tab.label;
			})
		)) {
			expect(labels).toContain(label);
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

	it('does not route the reader anywhere itself', async () => {
		const screen = await render(<Hero />, { wrapper });

		// The exit ramp lives after the commands section now; the hero is only the opening.
		expect(screen.container.querySelector('a[href="/docs/getting-started"]')).toBeNull();
	});

	it('replays the transcript when the reader switches tabs', async () => {
		const screen = await render(<Hero />, { wrapper });

		// The doctor tab is the second `~`: the doctor session sits in the home directory too.
		const doctorTab = screen.container.querySelectorAll('button[role="tab"]')[1];

		if (doctorTab === undefined) {
			throw new Error('the hero terminal has no second tab');
		}

		await userEvent.click(doctorTab);

		await expect.element(screen.getByText(/Ready: Node\.js, git and 4 package managers/)).toBeInTheDocument();
	});
});

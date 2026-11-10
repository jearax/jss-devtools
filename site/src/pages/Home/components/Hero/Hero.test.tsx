import { ThemeProvider } from '@jjuidev/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CLI_VERSION, INSTALL_COMMAND, INSTALL_PLATFORM_LABEL, PRODUCT_NAME } from '@/constants/cli.constant';
import { HERO_TERMINAL_TABS, VALUE_LINES } from '@/pages/Home/Home.constant';

import Hero from './Hero';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

/*
 * The site's browser tests run with reduced motion, so the reveal animation never ends on its own.
 * The test ends the reveal the way the animated run does: on the element the terminal marks as the
 * end of the transcript, or on the last revealed line.
 */
const endTheReveal = (screen: { container: Element }) => {
	const body = screen.container.querySelector('[role="tabpanel"]');
	const end = body?.querySelector('[data-reveal-end]') ?? body?.lastElementChild;

	if (!(end instanceof HTMLElement)) {
		throw new Error('the terminal has no revealed element to end');
	}

	end.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
};

describe('Hero', () => {
	it('shows the version eyebrow, the two-tone headline and the value line', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();

		for (const line of VALUE_LINES) {
			await expect.element(screen.getByText(line)).toBeInTheDocument();
		}

		// The eyebrow carries the version the build injected from the package facts.
		await expect.element(screen.getByText(`v${CLI_VERSION}`)).toBeInTheDocument();
	});

	it('shows the install block with the command, the copy control and the platform line', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByText(INSTALL_COMMAND)).toBeInTheDocument();
		await expect.element(screen.getByText(INSTALL_PLATFORM_LABEL)).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Copy the install command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(INSTALL_COMMAND);
	});

	it('shows the transcripts in a tabbed terminal window titled by the CLI', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByText(PRODUCT_NAME, { exact: true }).first()).toBeInTheDocument();

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

	it('offers a replay control in the animated window', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByRole('button', { name: 'Replay the transcript' })).toBeInTheDocument();
	});

	it('routes the reader to the quickstart from the hero', async () => {
		const screen = await render(<Hero />, { wrapper });

		await expect.element(screen.getByRole('link', { name: 'Then read the quickstart →' })).toBeInTheDocument();
	});

	it('keeps the left column fixed when switching tabs', async () => {
		const screen = await render(<Hero />, { wrapper });

		const eyebrow = screen.container.querySelector('[class*="eyebrow"]');

		if (eyebrow === null) {
			throw new Error('the hero has no eyebrow');
		}

		const top = eyebrow.getBoundingClientRect().top;
		const tabs = [...screen.container.querySelectorAll('button[role="tab"]')];

		for (const tab of tabs) {
			await userEvent.click(tab);
			expect(eyebrow.getBoundingClientRect().top).toBe(top);
		}
	});

	it('opens the new project in Claude Code on the second tab', async () => {
		const screen = await render(<Hero />, { wrapper });

		const labels = [...screen.container.querySelectorAll('button[role="tab"]')].map((tab) => {
			return tab.textContent;
		});

		expect(labels).toEqual(['init', 'Claude Code', 'harness']);

		await screen.getByRole('tab', { name: 'Claude Code' }).click();

		await expect.element(screen.getByText('cd my-app')).toBeInTheDocument();
		await expect.element(screen.getByText('Fable 5.2 with max effort · Claude Max')).toBeInTheDocument();
		await expect.element(screen.getByText('Run harness onboarding now?')).toBeInTheDocument();
	});

	it('replays the transcript when the reader switches tabs', async () => {
		const screen = await render(<Hero />, { wrapper });

		await screen.getByRole('tab', { name: 'harness' }).click();

		await expect.element(screen.getByText(/Harness is healthy/)).toBeInTheDocument();
	});

	it('resumes the tab loop when the reader replays after picking a tab', async () => {
		const screen = await render(<Hero />, { wrapper });

		// The reader's own pick wins: the window stays where they put it.
		await screen.getByRole('tab', { name: 'Claude Code' }).click();
		await screen.getByRole('button', { name: 'Replay the transcript' }).click();

		endTheReveal(screen);

		await expect
			.element(screen.getByRole('tab', { name: 'harness' }), { timeout: 5000 })
			.toHaveAttribute('aria-selected', 'true');
	});

	it('keeps the loop advancing when the reader replays while it plays', async () => {
		const screen = await render(<Hero />, { wrapper });

		await screen.getByRole('button', { name: 'Replay the transcript' }).click();

		endTheReveal(screen);

		await expect
			.element(screen.getByRole('tab', { name: 'Claude Code' }), { timeout: 8000 })
			.toHaveAttribute('aria-selected', 'true');
	});

	it('shows the finished transcript and stays put under reduced motion', async () => {
		const screen = await render(<Hero />, { wrapper });

		const body = screen.container.querySelector('[role="tabpanel"]');
		const line = [...(body?.querySelectorAll('p') ?? [])].at(-1);

		if (line === undefined) {
			throw new Error('the terminal shows no transcript line');
		}

		const style = line.ownerDocument.defaultView?.getComputedStyle(line);

		// Nothing animates, so the line is shown whole and the window never moves on its own.
		expect(style?.opacity).toBe('1');
		expect(style?.animationName).toBe('none');

		await new Promise((resolve) => {
			setTimeout(resolve, 600);
		});

		await expect.element(screen.getByRole('tab', { name: 'init' })).toHaveAttribute('aria-selected', 'true');
	});
});

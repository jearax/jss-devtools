import { ThemeProvider } from '@jjuidev/react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { stripAnsi } from '@/components/Terminal/ansi.util';
import {
	DOCTOR_TRANSCRIPT,
	HARNESS_ONBOARDED_TRANSCRIPT,
	HARNESS_TRANSCRIPT,
	INIT_RUN_TRANSCRIPT,
	INIT_TRANSCRIPT
} from '@/constants/transcripts.constant';

import Terminal from './Terminal';

const TRANSCRIPTS = [
	DOCTOR_TRANSCRIPT,
	INIT_TRANSCRIPT,
	INIT_RUN_TRANSCRIPT,
	HARNESS_TRANSCRIPT,
	HARNESS_ONBOARDED_TRANSCRIPT
];

const COMMAND = 'jss-devtools doctor';
const OTHER = 'jss-devtools init';

describe('Terminal', () => {
	it('prints every line exactly as the CLI printed it', async () => {
		for (const lines of TRANSCRIPTS) {
			const screen = await render(<Terminal lines={lines} />, { wrapper: ThemeProvider });

			const rendered = [...screen.container.querySelectorAll('p')].map((line) => {
				return line.textContent;
			});

			expect(rendered).toEqual(
				lines.map((line) => {
					return stripAnsi(line);
				})
			);
		}
	});

	it('colours the glyph with the colour the CLI printed', async () => {
		const screen = await render(<Terminal lines={DOCTOR_TRANSCRIPT} />, { wrapper: ThemeProvider });

		const glyphs = [...screen.container.querySelectorAll('span')].filter((span) => {
			return ['✔', '✖', '⚠', '◇'].includes(span.textContent ?? '');
		});

		expect(glyphs.length).toBeGreaterThan(0);

		for (const glyph of glyphs) {
			expect(glyph.getAttribute('data-color')).toBe('success');
		}
	});

	it('keeps the box drawing quiet', async () => {
		const screen = await render(<Terminal lines={DOCTOR_TRANSCRIPT} />, { wrapper: ThemeProvider });

		const boxes = [...screen.container.querySelectorAll('span')].filter((span) => {
			return span.textContent?.startsWith('│') ?? false;
		});

		expect(boxes.length).toBeGreaterThan(0);

		for (const box of boxes) {
			expect(box.getAttribute('data-color')).toBe('muted');
		}
	});

	it('offers no copy button unless the window asks for one', async () => {
		const screen = await render(<Terminal command={COMMAND} lines={[]} />, { wrapper: ThemeProvider });

		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('puts an icon-only copy button beside the command, and it copies the command', async () => {
		const screen = await render(<Terminal command={COMMAND} lines={[]} commandCopy />, { wrapper: ThemeProvider });

		const button = screen.getByRole('button', { name: 'Copy the command' });

		await expect.element(button).toBeInTheDocument();
		expect(screen.container.querySelector('button')?.textContent).toBe('');

		await button.click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(COMMAND);
	});

	it('opens a tab transcript with the shell comment the tab carries', async () => {
		const screen = await render(
			<Terminal
				tabs={[
					{
						label: '~',
						comment: 'Check the environment',
						command: COMMAND,
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('# Check the environment')).toBeInTheDocument();
	});

	it('shows a window-level comment for a window with a single transcript', async () => {
		const screen = await render(<Terminal comment="Check the environment" command={COMMAND} lines={[]} />, {
			wrapper: ThemeProvider
		});

		await expect.element(screen.getByText('# Check the environment')).toBeInTheDocument();
	});

	it('copies the active tab command, and a tab switch retypes the transcript', async () => {
		const screen = await render(
			<Terminal
				commandCopy
				tabs={[
					{
						label: 'one',
						command: COMMAND,
						lines: []
					},
					{
						label: 'two',
						command: OTHER,
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(COMMAND);

		await screen.getByRole('tab', { name: 'two' }).click();

		await expect.element(screen.getByText(new RegExp(OTHER))).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(OTHER);
	});
});

describe('the play/pause control', () => {
	const pauseTabs = [
		{
			label: 'one',
			command: 'jss-devtools doctor',
			lines: ['Everything looks good.'],
			advance: 2000
		},
		{
			label: 'two',
			command: 'jss-devtools init',
			lines: []
		}
	];

	const renderPause = async (props = {}) => {
		return await render(<Terminal variant="animated" replay tabs={pauseTabs} {...props} />, {
			wrapper: ThemeProvider
		});
	};

	const rootElement = (screen: { container: HTMLElement }) => {
		return screen.container.firstElementChild as HTMLElement;
	};

	const selectedTab = (screen: { container: HTMLElement }) => {
		return screen.container.querySelector('button[role="tab"][aria-selected="true"]')?.textContent;
	};

	// The suite runs under prefers-reduced-motion, so this is the reduced-motion case itself.
	it('renders next to replay under reduced motion, with pause to the left of replay', async () => {
		const screen = await renderPause();

		const buttons = [...rootElement(screen).querySelectorAll('button')];

		const pause = buttons.findIndex((button) => {
			return button.getAttribute('aria-label') === 'Pause the transcript';
		});

		const replay = buttons.findIndex((button) => {
			return button.getAttribute('aria-label') === 'Replay the transcript';
		});

		expect(pause).toBeGreaterThan(-1);
		expect(replay).toBeGreaterThan(pause);
	});

	it('flips its label and the root data-paused as it toggles', async () => {
		const screen = await renderPause();

		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Play the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('true');

		await screen.getByRole('button', { name: 'Play the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Pause the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');
	});

	it('a replay while paused plays again', async () => {
		const screen = await renderPause();

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();
		await expect.element(screen.getByRole('button', { name: 'Play the transcript' })).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Replay the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Pause the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');
	});

	it('pausing during the advance wait holds the tab, and play finishes the wait', async () => {
		const screen = await renderPause();

		await expect.element(screen.getByText('Everything looks good.')).toBeInTheDocument();

		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		end?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await new Promise((resolve) => {
			setTimeout(resolve, 1000);
		});

		expect(selectedTab(screen)).toBe('one');

		await screen.getByRole('button', { name: 'Play the transcript' }).click();

		await expect
			.poll(
				() => {
					return selectedTab(screen);
				},
				{ timeout: 3000 }
			)
			.toBe('two');
	});

	it('a program screen inside a paused root has its animations paused', async () => {
		const screen = await render(
			<Terminal
				variant="animated"
				replay
				tabs={[
					{
						label: 'one',
						command: 'jss-devtools doctor',
						lines: [],
						screen: <div data-screen-probe>the screen</div>
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('the screen')).toBeInTheDocument();

		const wrapper = screen.container.querySelector('[data-screen-probe]')?.parentElement;

		expect(wrapper).toBeTruthy();
		expect(getComputedStyle(wrapper!).animationPlayState).toBe('running');

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		expect(getComputedStyle(wrapper!).animationPlayState).toBe('paused');
	});
});

import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { VALUE_LINE } from '@/pages/Home/Home.constant';

import Home from './Home';

const renderHome = async () => {
	return render(<Home />, { wrapper: ThemeProvider });
};

describe('Home', () => {
	it('shows the headline without an eyebrow wordmark', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();

		// Decision 1: the name lives in the header's logo; the hero opens with the headline itself.
		// The hero's inner wrapper is the first one on the page, so its first child is the h1.
		const inner = screen.container.querySelector('[class*="inner"]');

		expect(inner?.firstElementChild?.tagName).toBe('H1');
	});

	it('shows the value line', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText(VALUE_LINE)).toBeInTheDocument();
	});

	it('shows the install command in the hero window and in the first run', async () => {
		const screen = await renderHome();

		// Once in the hero's terminal, once in the getting started steps.
		const commands = screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/).all();

		expect(commands.length).toBe(2);
	});

	it('shows the three commands', async () => {
		const screen = await renderHome();

		for (const name of ['init', 'doctor', 'harness']) {
			await expect.element(screen.getByRole('heading', { name })).toBeInTheDocument();
		}
	});

	it('offers a way into the docs from the getting started band', async () => {
		const screen = await renderHome();

		// The hero has no CTA row (decision 2); the getting started band routes the reader.
		await expect
			.element(screen.getByRole('link', { name: 'Read the getting started guide' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});

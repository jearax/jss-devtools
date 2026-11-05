import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { VALUE_LINES } from '@/pages/Home/Home.constant';

import Home from './Home';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('Home', () => {
	it('shows the headline without an eyebrow wordmark', async () => {
		const screen = await render(<Home />, { wrapper });

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();

		// Decision 1: the name lives in the header's logo; the hero opens with the headline itself.
		// The hero's inner wrapper is the first one on the page, so its first child is the h1.
		const inner = screen.container.querySelector('[class*="inner"]');

		expect(inner?.firstElementChild?.tagName).toBe('H1');
	});

	it('shows the value lines, each shorter than the one above', async () => {
		const screen = await render(<Home />, { wrapper });

		// The copy is pre-broken into lines that shrink line over line, so the hero reads as a
		// narrowing triangle together with the headline.
		let previous = Number.MAX_SAFE_INTEGER;

		for (const line of VALUE_LINES) {
			await expect.element(screen.getByText(line)).toBeInTheDocument();
			expect(line.length).toBeLessThan(previous);
			previous = line.length;
		}
	});

	it('shows the install command in the hero window', async () => {
		const screen = await render(<Home />, { wrapper });

		// The getting started band is gone; the hero terminal is the command's only home on the page.
		const commands = screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/).all();

		expect(commands.length).toBe(1);
	});

	it('shows the three commands', async () => {
		const screen = await render(<Home />, { wrapper });

		for (const name of ['init', 'doctor', 'harness']) {
			await expect.element(screen.getByRole('heading', { name })).toBeInTheDocument();
		}
	});

	it('offers the way into the docs from the hero', async () => {
		const screen = await render(<Home />, { wrapper });

		// The getting started section is gone; the hero's own button routes the reader.
		await expect
			.element(screen.getByRole('link', { name: 'Getting started' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});

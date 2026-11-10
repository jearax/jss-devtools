import { ThemeProvider } from '@jjuidev/react';
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
	it('opens the hero with the eyebrow, then the headline', async () => {
		const screen = await render(<Home />, { wrapper });

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();

		// The eyebrow is the copy column's first element, ahead of the headline.
		const inner = screen.container.querySelector('[class*="inner"]');

		expect(inner?.firstElementChild?.firstElementChild?.className).toContain('eyebrow');
	});

	it('shows the value line under the headline', async () => {
		const screen = await render(<Home />, { wrapper });

		for (const line of VALUE_LINES) {
			await expect.element(screen.getByText(line)).toBeInTheDocument();
		}
	});

	it('shows the install command once, in the hero block', async () => {
		const screen = await render(<Home />, { wrapper });

		const commands = screen.getByText(/jss-devtools\.jjuidev\.com\/install\.sh/).all();

		expect(commands.length).toBe(1);
	});

	it('does not render the closing install band', async () => {
		const screen = await render(<Home />, { wrapper });

		expect(screen.container.textContent).not.toContain('Install in one');
		expect(screen.getByRole('link', { name: 'Getting started' }).query()).toBeNull();
	});

	it('shows the three commands', async () => {
		const screen = await render(<Home />, { wrapper });

		for (const name of ['init', 'doctor', 'harness']) {
			await expect
				.element(screen.getByRole('heading', { name: new RegExp(`jss-devtools ${name}`) }))
				.toBeInTheDocument();
		}
	});
});

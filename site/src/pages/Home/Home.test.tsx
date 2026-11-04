import { ThemeProvider } from '@jjuidev/design-system';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LICENSE, NODE_FLOOR } from '@/constants/cli.constant';
import { VALUE_LINE } from '@/pages/Home/Home.constant';

import Home from './Home';

const renderHome = async () => {
	return render(<Home />, { wrapper: ThemeProvider });
};

describe('Home', () => {
	it('shows the product name and the headline', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByRole('heading', { name: /Set up the toolchain/ })).toBeInTheDocument();
		await expect.element(screen.getByText('jss-devtools')).toBeInTheDocument();
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

	it('shows the facts band', async () => {
		const screen = await renderHome();

		await expect.element(screen.getByText(LICENSE)).toBeInTheDocument();
		await expect.element(screen.getByText(`Node ${NODE_FLOOR}`)).toBeInTheDocument();
	});

	it('shows the three commands', async () => {
		const screen = await renderHome();

		for (const name of ['init', 'doctor', 'harness']) {
			await expect.element(screen.getByRole('heading', { name })).toBeInTheDocument();
		}
	});

	it('offers a way into the docs', async () => {
		const screen = await renderHome();

		await expect
			.element(screen.getByRole('link', { name: 'Get started' }))
			.toHaveAttribute('href', '/docs/getting-started');
	});
});

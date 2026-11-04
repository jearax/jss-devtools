import { ThemeProvider } from '@jjuidev/design-system';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { SEARCH_TRIGGER_LABEL } from '@/constants/search.constant';

import Layout from './Layout';

const wrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
};

describe('Layout', () => {
	it('offers a skip link to the content', async () => {
		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		await expect.element(screen.getByRole('link', { name: 'Skip to the content' })).toHaveAttribute('href', '#main');
	});

	it('opens and closes the menu from the header button', async () => {
		// The menu button is the narrow layout's, so the viewport has to be narrow.
		await page.viewport(360, 720);

		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		const button = screen.getByRole('button', { name: 'Open the menu' });

		await expect.element(button).toHaveAttribute('aria-expanded', 'false');

		await button.click();

		await expect
			.element(screen.getByRole('button', { name: 'Close the menu' }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('puts the page inside the main landmark', async () => {
		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		await expect.element(screen.getByRole('main')).toContainElement(screen.getByText('The page'));
	});

	it('opens the search palette from the header trigger', async () => {
		// The trigger in the bar is the wide layout's, so the viewport has to be wide.
		await page.viewport(1280, 720);

		const screen = await render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>The page</p>} />
				</Route>
			</Routes>,
			{ wrapper }
		);

		// The header carries the trigger twice: once in the bar and once in the narrow panel.
		await screen.getByRole('button', { name: SEARCH_TRIGGER_LABEL }).first().click();

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
